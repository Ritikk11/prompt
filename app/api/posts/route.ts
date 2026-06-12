import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { Post, PostComment, SiteSettings } from '@/lib/types';

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

export async function POST(request: Request) {
  const admin = createAdminClient();
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
    if (!settings.features?.userSubmissions) {
      return NextResponse.json({ error: 'User submissions are disabled' }, { status: 403 });
    }

    const post = data as Post | undefined;
    if (!post?.id || !post.title || !post.images?.length) {
      return NextResponse.json({ error: 'Invalid post' }, { status: 400 });
    }

    const cleanPost: Post = {
      ...post,
      authorId: user.id,
      status: settings.features.userSubmissionsAutoApprove ? 'published' : 'pending',
      visibility: 'public',
      featured: false,
      views: post.views || 0,
      likes: post.likes || 0,
      createdAt: post.createdAt || new Date().toISOString(),
    };

    const { error } = await admin.from('posts').upsert({ id: cleanPost.id, data: cleanPost });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

        const updated = {
          ...post,
          comments: [...(post.comments || []), comment],
        };
        const { error } = await admin.from('posts').update({ data: updated }).eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, comment });
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
