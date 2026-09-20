import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { submitToIndexNow } from '@/lib/indexnow';
import type { Post, Section, SiteSettings } from '@/lib/types';

function getAllToolsFromPost(post: Partial<Post>) {
  const tools = new Set<string>();
  (post.aiTools || []).forEach((tool) => tool && tools.add(tool));
  (post.images || []).forEach((image: any) => {
    (image?.aiTools || [image?.aiTool]).forEach((tool: string) => tool && tools.add(tool));
  });
  return Array.from(tools);
}

// Content pages are ISR-cached; on-demand revalidation keeps them fresh right after an
// admin edit instead of waiting for the time-based revalidate window to expire.
function revalidateContent(resource: string, data: any, id?: string, admin?: any) {
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap-main.xml');
  revalidatePath('/sitemap-prompts.xml');

  if (resource === 'posts') {
    const slug = data?.slug || data?.id || id;
    if (slug) {
      revalidatePath(`/${slug}`);
      submitToIndexNow([`/${slug}`, '/explore']).catch(() => {});
    }
    (data?.tags || []).forEach((tag: string) => tag && revalidatePath(`/tag/${encodeURIComponent(tag.toLowerCase())}`));
    getAllToolsFromPost(data || {}).forEach((tool) => revalidatePath(`/tool/${encodeURIComponent(tool.toLowerCase())}`));
    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/api/posts');

    // Automatically purge all active SEO landing pages so the new post appears immediately without manual page edits
    if (admin) {
      admin.from('seoPages').select('data').then(({ data: rows }: any) => {
        (rows || []).forEach((row: any) => {
          const spSlug = row?.data?.slug;
          if (spSlug) {
            revalidatePath(`/${spSlug}`);
            revalidatePath(`/page/${spSlug}`);
          }
        });
      }).catch(() => {});
    }
    return;
  }

  if (resource === 'sections') {
    const slug = data?.slug || data?.id || id;
    if (slug) revalidatePath(`/section/${slug}`);
    revalidatePath('/');
    return;
  }

  if (resource === 'settings') {
    // Settings drive the shared layout/header/footer plus homepage copy, SEO
    // templates, feature-gated public routes, and discovery-page text.
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/explore');
    revalidatePath('/blog');
    revalidatePath('/guides');
    revalidatePath('/login');
    revalidatePath('/submit');
    revalidatePath('/profile');
    return;
  }

  if (resource === 'seopages') {
    const slug = data?.slug || data?.id || id;
    if (slug) {
      revalidatePath(`/page/${slug}`);
      revalidatePath(`/${slug}`);
      submitToIndexNow([`/${slug}`]).catch(() => {});
    }
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    revalidatePath('/sitemap-main.xml');
    return;
  }
}

const resources = new Set(['posts', 'sections', 'settings', 'seopages']);
const tableForResource: Record<string, string> = {
  posts: 'posts',
  sections: 'sections',
  settings: 'settings',
  seopages: 'seoPages',
};

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isMissingTableError(error: unknown) {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as any).message) : '';
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : '';
  return code === '42P01' || message.includes('Could not find the table') || message.includes('does not exist');
}

function isValidId(value: unknown) {
  return typeof value === 'string' && value.length > 0 && value.length <= 160 && /^[a-zA-Z0-9_:/.-]+$/.test(value);
}

function cleanText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validatePost(data: unknown): data is Post {
  if (!isPlainObject(data)) return false;
  if (!isValidId(data.id) || !cleanText(data.title, 180) || !cleanText(data.description, 2000)) return false;
  if (!Array.isArray(data.images) || data.images.length > 30) return false;
  if (data.status && !['published', 'pending', 'draft'].includes(data.status)) return false;
  if (data.visibility && !['public', 'private'].includes(data.visibility)) return false;
  return true;
}

function validateSection(data: unknown): data is Section {
  if (!isPlainObject(data)) return false;
  if (!isValidId(data.id) || !cleanText(data.name, 180)) return false;
  if (!['ai-tool', 'latest', 'popular', 'custom', 'trending', 'tag', 'category'].includes(data.type)) return false;
  if (data.location && !['homepage', 'header', 'footer'].includes(data.location)) return false;
  if (typeof data.order !== 'number' || typeof data.visible !== 'boolean' || typeof data.limit !== 'number') return false;
  if (data.limit < 1 || data.limit > 50) return false;
  return true;
}

function validateSettings(data: unknown): data is SiteSettings {
  if (!isPlainObject(data)) return false;
  if (!cleanText(data.siteTitle, 180) || !cleanText(data.siteDescription, 2000)) return false;
  if (!Array.isArray(data.aiTools) || data.aiTools.length > 80) return false;
  if (data.adminEmails && (!Array.isArray(data.adminEmails) || data.adminEmails.some((email: unknown) => typeof email !== 'string' || email.length > 254))) return false;
  return true;
}

function validateSeoPage(data: unknown) {
  if (!isPlainObject(data)) return false;
  if (!isValidId(data.id) || !cleanText(data.title, 180)) return false;
  if (data.slug && !isValidId(data.slug)) return false;
  return true;
}

function validateResourceData(resource: string, data: unknown) {
  if (resource === 'posts') return validatePost(data);
  if (resource === 'sections') return validateSection(data);
  if (resource === 'settings') return validateSettings(data);
  if (resource === 'seopages') return validateSeoPage(data);
  return false;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const admin = auth.admin!;

  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');
  if (resource === 'seopages') {
    const { data: rows, error } = await admin.from('seoPages').select('data');
    if (error && !isMissingTableError(error)) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ seopages: (rows || []).map((row: any) => row.data) });
  }

  const [posts, sections, settings, seopages, comments] = await Promise.all([
    admin.from('posts').select('data'),
    admin.from('sections').select('data'),
    admin.from('settings').select('data').eq('id', 'global').maybeSingle(),
    admin.from('seoPages').select('data'),
    admin.from('comments').select('id, post_id, user_id, user_name, user_avatar, text, status, created_at'),
  ]);
  if (comments.error && !isMissingTableError(comments.error)) {
    return NextResponse.json({ error: comments.error.message }, { status: 500 });
  }
  const { data: userData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const environmentAdminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
    : [];
  const savedAdminEmails = settings.data?.data?.adminEmails || [];
  const allAdminEmails = new Set([
    ...environmentAdminEmails,
    ...savedAdminEmails.map((email: string) => email.toLowerCase()),
  ]);

  const tableCommentsByPost = new Map<string, any[]>();
  for (const row of comments.data || []) {
    const comment = {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      text: row.text,
      status: row.status,
      createdAt: row.created_at,
    };
    tableCommentsByPost.set(row.post_id, [...(tableCommentsByPost.get(row.post_id) || []), comment]);
  }

  const mergedPosts = (posts.data || []).map((row: any) => {
    const post = row.data;
    const tableComments = tableCommentsByPost.get(post.id) || [];
    if (tableComments.length === 0) return post;
    return {
      ...post,
      comments: [
        ...(post.comments || []).filter((comment: any) => !tableComments.some((item) => item.id === comment.id)),
        ...tableComments,
      ],
    };
  });

  return NextResponse.json({
    posts: mergedPosts,
    sections: (sections.data || []).map((row: any) => row.data),
    settings: settings.data?.data || null,
    seopages: (seopages.data || []).map((row: any) => row.data),
    users: (userData?.users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      bannedUntil: user.banned_until,
      role: user.email && allAdminEmails.has(user.email.toLowerCase()) ? 'Admin' : 'Subscriber',
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  const admin = auth.admin!;
  const body = await request.json();
  const { action, resource, id, data } = body || {};

  if (action === 'reset') {
    return NextResponse.json({ error: 'Mock data disabled' }, { status: 400 });
  }

  if (action === 'deleteMockData') {
    return NextResponse.json({ error: 'Mock data disabled' }, { status: 400 });
  }

  if (action === 'updateUserStatus') {
    const { userId, status, durationValue, durationUnit } = data || {};
    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing userId or status' }, { status: 400 });
    }
    let banDuration = 'none';
    if (status === 'suspended' || status === 'banned') {
      const val = typeof durationValue === 'number' && durationValue > 0 ? durationValue : 24;
      if (durationUnit === 'Hours') banDuration = `${val}h`;
      else if (durationUnit === 'Days') banDuration = `${val * 24}h`;
      else if (durationUnit === 'Weeks') banDuration = `${val * 24 * 7}h`;
      else if (durationUnit === 'Months') banDuration = `${val * 24 * 30}h`;
      else if (durationUnit === 'Permanent') banDuration = '876000h';
      else if (durationUnit === 'None') banDuration = 'none';
      else banDuration = '876000h';
    }
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banDuration });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (!resources.has(resource)) {
    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
  }
  const table = tableForResource[resource];

  if (action === 'upsert') {
    const rowId = id || data?.id || (resource === 'settings' ? 'global' : undefined);
    if (!rowId || !data) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    if (!isValidId(rowId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    if (resource === 'settings' && rowId !== 'global') return NextResponse.json({ error: 'Settings can only be saved to global' }, { status: 400 });
    if (!validateResourceData(resource, data)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    // Freshness signal for schema.org dateModified on prompt pages.
    if (resource === 'posts') {
      data.updatedAt = new Date().toISOString();
      if (data.featured) {
        data.featuredAt = data.featuredAt || new Date().toISOString();
        // Enforce maximum 6 featured posts limit: auto-unfeature oldest
        try {
          const { data: allPostRows } = await admin.from('posts').select('id, data');
          const otherFeatured = (allPostRows || [])
            .filter((r: any) => r.id !== rowId && r.data?.featured === true)
            .map((r: any) => ({ id: r.id, post: r.data }));

          if (otherFeatured.length >= 6) {
            otherFeatured.sort((a: any, b: any) => {
              const timeA = new Date(a.post.featuredAt || a.post.createdAt || 0).getTime();
              const timeB = new Date(b.post.featuredAt || b.post.createdAt || 0).getTime();
              return timeA - timeB; // oldest first
            });
            const excessCount = otherFeatured.length - 5;
            const toUnfeature = otherFeatured.slice(0, excessCount);
            for (const item of toUnfeature) {
              await admin.from('posts').update({ data: { ...item.post, featured: false } }).eq('id', item.id);
            }
          }
        } catch (err) {
          console.error('Featured limit check error:', err);
        }
      }
    }
    const { error } = await admin.from(table).upsert({ id: rowId, data });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateContent(resource, data, rowId, admin);

    // Auto-publish to Pinterest in background if post is published and auto-publish is enabled
    if (resource === 'posts' && data.status === 'published' && !data.pinterestPinId) {
      (async () => {
        try {
          const { data: settingsRow } = await admin.from('settings').select('data').eq('id', 'global').maybeSingle();
          const pSettings = settingsRow?.data?.pinterestSettings;
          if (pSettings?.autoPublishNewPosts && pSettings?.isConnected) {
            const { publishPostToPinterest } = await import('@/lib/pinterest');
            await publishPostToPinterest(data, admin);
          }
        } catch (err) {
          console.error('Pinterest auto-publish error:', err);
        }
      })();
    }

    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!isValidId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    if (resource === 'settings') return NextResponse.json({ error: 'Settings cannot be deleted' }, { status: 400 });

    let itemSlug: string | undefined;
    if (resource === 'seopages' || resource === 'posts') {
      const { data: row } = await admin.from(table).select('data').eq('id', id).maybeSingle();
      itemSlug = row?.data?.slug;
    }

    const { error } = await admin.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateContent(resource, itemSlug ? { slug: itemSlug, id } : null, id, admin);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
