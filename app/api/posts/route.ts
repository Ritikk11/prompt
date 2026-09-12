import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-admin';
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { fetchPostSummaries, fetchSeoPages } from '@/lib/data';
import { submitToIndexNow } from '@/lib/indexnow';
import type { Post, PostComment, SiteSettings } from '@/lib/types';

function getAllToolsFromPost(post: Partial<Post>) {
  const tools = new Set<string>();
  (post.aiTools || []).forEach((tool) => tool && tools.add(tool));
  (post.images || []).forEach((image: any) => {
    (image?.aiTools || [image?.aiTool]).forEach((tool: string) => tool && tools.add(tool));
  });
  return Array.from(tools);
}

// Only new/published submissions need on-demand revalidation. view/like/bookmark/comment
// fire on nearly every page load — revalidating there would defeat ISR caching entirely.
function revalidateNewPost(post: Post) {
  const slug = post.slug || post.id;
  if (slug) revalidatePath(`/${slug}`);
  (post.tags || []).forEach((tag) => tag && revalidatePath(`/tag/${encodeURIComponent(tag.toLowerCase())}`));
  getAllToolsFromPost(post).forEach((tool) => revalidatePath(`/tool/${encodeURIComponent(tool.toLowerCase())}`));
  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap-main.xml');
  revalidatePath('/sitemap-prompts.xml');

  // Purge all SEO landing pages so the new post displays on them immediately
  fetchSeoPages().then((pages) => {
    (pages || []).forEach((p: any) => {
      if (p?.slug) {
        revalidatePath(`/${p.slug}`);
        revalidatePath(`/page/${p.slug}`);
      }
    });
  }).catch(() => {});

  if (slug && isPublicPost(post)) {
    // Non-blocking IndexNow notification for newly published prompts
    submitToIndexNow([`/${slug}`, '/explore']).catch(() => {});
  }
}

function isMissingTableError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
  return code === '42P01' || message.includes('Could not find the table') || message.includes('does not exist');
}

async function getUserFromRequest(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const admin = createAdminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function isPublicPost(post: Pick<Post, 'status' | 'visibility'>) {
  return (post.status === 'published' || !post.status) && post.visibility !== 'private';
}

function cleanTextValue(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanStringArray(value: unknown, maxItems = 30, maxLength = 80) {
  return Array.isArray(value)
    ? value
        .map((item) => cleanTextValue(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}

function slugifySubmission(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export async function GET() {
  const posts = await fetchPostSummaries();
  return NextResponse.json(
    { posts },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } },
  );
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  
  const { data: globalSettingsRow } = await admin.from('settings').select('data').eq('id', 'global').maybeSingle();
  const globalSettings = (globalSettingsRow?.data || {}) as SiteSettings;
  
  if (globalSettings.maintenanceMode) {
    if (!(await isCurrentUserAdmin(request))) {
      return NextResponse.json({ error: 'Service unavailable during maintenance' }, { status: 503 });
    }
  }

  const body = await request.json().catch(() => null);
  const { action, id, data, liked, text } = body || {};

  if (action === 'submit') {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: settingsRow, error: settingsError } = await admin
      .from('settings')
      .select('data')
      .eq('id', 'global')
      .maybeSingle();
    if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });

    const settings = (settingsRow?.data || {}) as SiteSettings;
    if (!settings.features?.userProfiles || !settings.features?.userSubmissions) {
      return NextResponse.json({ error: 'User submissions are disabled' }, { status: 403 });
    }

    // Submission flood protection: max 5 post submissions per user per hour,
    // counted against the submissions table (fall open if it's missing so the
    // posts-data legacy path keeps working).
    const { count: submitCount } = await admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if (submitCount !== null && submitCount >= 5) {
      return NextResponse.json({ error: 'Submission limit reached (5 per hour). Try again later.' }, { status: 429 });
    }

    const post = data as Post | undefined;
    if (!post?.id || !post.title || !post.images?.length) {
      return NextResponse.json({ error: 'Invalid post' }, { status: 400 });
    }

    const submissionId = crypto.randomUUID();
    const slugBase = slugifySubmission(post.slug || post.title) || `submission-${submissionId.slice(0, 8)}`;
    const submittedAt = new Date().toISOString();
    const images = (post.images || [])
      .slice(0, 30)
      .map((image: any, index) => ({
        id: cleanTextValue(image?.id, 80) || `${submissionId}-${index + 1}`,
        url: cleanTextValue(image?.url, 2000),
        urls: cleanStringArray(image?.urls, 10, 2000),
        prompt: cleanTextValue(image?.prompt, 12000),
        aiTool: cleanTextValue(image?.aiTool, 80),
        aiTools: cleanStringArray(image?.aiTools || [image?.aiTool], 12, 80),
        model: cleanTextValue(image?.model, 120) || undefined,
      }))
      .filter((image) => image.url && image.prompt);

    if (images.length === 0) {
      return NextResponse.json({ error: 'Invalid post images' }, { status: 400 });
    }

    const cleanPost: Post = {
      id: submissionId,
      slug: `${slugBase}-${submissionId.slice(0, 8)}`,
      title: cleanTextValue(post.title, 180),
      description: cleanTextValue(post.description, 2000),
      extendedDescription: cleanTextValue(post.extendedDescription, 30000) || undefined,
      thumbnailUrl: cleanTextValue(post.thumbnailUrl, 2000) || images[0]?.url,
      referenceImages: cleanStringArray(post.referenceImages, 10, 2000),
      images,
      tags: cleanStringArray(post.tags, 30, 80),
      category: cleanTextValue(post.category, 80) || undefined,
      categories: cleanStringArray(post.categories, 10, 80),
      aiTools: cleanStringArray(post.aiTools || images.flatMap((image) => image.aiTools || [image.aiTool]), 12, 80),
      authorId: user.id,
      authorName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator',
      authorUsername: user.user_metadata?.username || user.email?.split('@')[0] || 'creator',
      authorAvatar: user.user_metadata?.avatar_url || '',
      status: settings.features.userSubmissionsAutoApprove ? 'published' : 'pending',
      visibility: 'public',
      featured: false,
      views: 0,
      likes: 0,
      comments: [],
      isPremium: false,
      isTemplate: Boolean(post.isTemplate),
      templateVariables: cleanStringArray(post.templateVariables, 30, 80),
      createdAt: submittedAt,
      updatedAt: submittedAt,
    };

    const submissionInsert = await admin.from('submissions').insert({
      id: cleanPost.id,
      user_id: user.id,
      data: cleanPost,
      status: cleanPost.status === 'published' ? 'published' : 'pending',
      reviewed_at: cleanPost.status === 'published' ? new Date().toISOString() : null,
    });
    if (submissionInsert.error && !isMissingTableError(submissionInsert.error)) {
      return NextResponse.json({ error: submissionInsert.error.message }, { status: 500 });
    }

    // Compatibility mirror: the current admin submissions tab still reads pending
    // submissions from posts.data. Remove this after the admin queue is fully
    // switched to the submissions table.
    const { error } = await admin.from('posts').upsert({ id: cleanPost.id, data: cleanPost });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (cleanPost.status === 'published') revalidateNewPost(cleanPost);
    return NextResponse.json({ ok: true, post: cleanPost });
  }

  if (action === 'view' || action === 'like' || action === 'bookmark' || action === 'comment') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data: row, error: readError } = await admin
      .from('posts')
      .select('data')
      .eq('id', id)
      .maybeSingle();
    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
    const post = row?.data as Post | undefined;
    if (!post || !isPublicPost(post)) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const user = await getUserFromRequest(request);

    if (action === 'comment' || action === 'bookmark') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data: settingsRow, error: settingsError } = await admin
        .from('settings')
        .select('data')
        .eq('id', 'global')
        .maybeSingle();
      if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });

      const settings = (settingsRow?.data || {}) as SiteSettings;

      if (action === 'comment') {
        if (!settings.features?.comments) {
          return NextResponse.json({ error: 'Comments are disabled' }, { status: 403 });
        }
        const cleanText = String(text || '').trim().slice(0, 1000);
        if (cleanText.length < 2) {
          return NextResponse.json({ error: 'Comment is too short' }, { status: 400 });
        }

        // Comment flood protection (no rate-limit infra on this stack): max
        // 10 comments per user per 10 minutes across the whole site, counted
        // against the comments table. Falls open if the table is missing so
        // the legacy JSONB comments path keeps working.
        const { count: recentCount, error: countError } = await admin
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
        if (!countError && recentCount !== null && recentCount >= 10) {
          return NextResponse.json({ error: 'You are commenting too fast. Try again in a few minutes.' }, { status: 429 });
        }

        const comment: PostComment = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          postId: id,
          userId: user.id,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Reader',
          userAvatar: user.user_metadata?.avatar_url,
          text: cleanText,
          status: settings.features.commentsRequireApproval ? 'pending' : 'approved',
          createdAt: new Date().toISOString(),
        };

        const commentInsert = await admin.from('comments').insert({
          id: comment.id,
          post_id: id,
          user_id: user.id,
          user_name: comment.userName,
          user_avatar: comment.userAvatar,
          text: comment.text,
          status: comment.status,
          created_at: comment.createdAt,
          updated_at: comment.createdAt,
        });
        if (!commentInsert.error) {
          return NextResponse.json({ ok: true, comment });
        }
        if (!isMissingTableError(commentInsert.error)) {
          return NextResponse.json({ error: commentInsert.error.message }, { status: 500 });
        }

        const updated = {
          ...post,
          comments: [...(post.comments || []), comment],
        };
        const { error } = await admin.from('posts').update({ data: updated }).eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, comment });
      }

      if (!settings.features?.userProfiles) {
        return NextResponse.json({ error: 'Saved prompts are disabled' }, { status: 403 });
      }

      const existingBookmark = await admin
        .from('user_bookmarks')
        .select('post_id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!existingBookmark.error || existingBookmark.data) {
        if (existingBookmark.data) {
          const { error } = await admin
            .from('user_bookmarks')
            .delete()
            .eq('post_id', id)
            .eq('user_id', user.id);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          return NextResponse.json({ ok: true, bookmarked: false });
        }

        const { error } = await admin
          .from('user_bookmarks')
          .insert({ post_id: id, user_id: user.id });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, bookmarked: true });
      }
      if (!isMissingTableError(existingBookmark.error)) {
        return NextResponse.json({ error: existingBookmark.error.message }, { status: 500 });
      }

      const bookmarkedBy = new Set(post.bookmarkedBy || []);
      const nextBookmarked = !bookmarkedBy.has(user.id);
      if (nextBookmarked) bookmarkedBy.add(user.id);
      else bookmarkedBy.delete(user.id);

      const updated = {
        ...post,
        bookmarkedBy: Array.from(bookmarkedBy),
      };
      const { error } = await admin.from('posts').update({ data: updated }).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, bookmarked: nextBookmarked });
    }

    const likedBy = new Set(post.likedBy || []);
    if (action === 'like' && user) {
      if (liked) {
        const { error } = await admin.from('user_likes').insert({ post_id: id, user_id: user.id });
        if (error && !isMissingTableError(error) && error.code !== '23505') {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        const { error } = await admin
          .from('user_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
        if (error && !isMissingTableError(error)) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      if (liked) likedBy.add(user.id);
      else likedBy.delete(user.id);
    }

    const updated = {
      ...post,
      views: action === 'view' ? (post.views || 0) + 1 : post.views || 0,
      likes: action === 'like' ? Math.max(0, (post.likes || 0) + (liked ? 1 : -1)) : post.likes || 0,
      likedBy: action === 'like' && user ? Array.from(likedBy) : post.likedBy,
    };

    const { error } = await admin.from('posts').update({ data: updated }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
