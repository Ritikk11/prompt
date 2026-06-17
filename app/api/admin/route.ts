import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { seedPosts, seedSections } from '@/lib/data/seedData';
import type { Post, Section, SiteSettings } from '@/lib/types';

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
  if (data.location && !['homepage', 'header'].includes(data.location)) return false;
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

  const [posts, sections, settings, seopages] = await Promise.all([
    admin.from('posts').select('data'),
    admin.from('sections').select('data'),
    admin.from('settings').select('data').eq('id', 'global').maybeSingle(),
    admin.from('seoPages').select('data'),
  ]);
  const { data: userData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

  return NextResponse.json({
    posts: (posts.data || []).map((row: any) => row.data),
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
    for (const section of seedSections) {
      await admin.from('sections').upsert({ id: section.id, data: section });
    }
    for (const post of seedPosts) {
      await admin.from('posts').upsert({ id: post.id, data: post });
    }
    await admin.from('settings').upsert({ id: 'seeded', data: { completedAt: new Date().toISOString() } });
    return NextResponse.json({ ok: true });
  }

  if (action === 'deleteMockData') {
    for (const post of seedPosts) {
      await admin.from('posts').delete().eq('id', post.id);
    }
    for (const section of seedSections) {
      await admin.from('sections').delete().eq('id', section.id);
    }
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
    const { error } = await admin.from(table).upsert({ id: rowId, data });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!isValidId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    if (resource === 'settings') return NextResponse.json({ error: 'Settings cannot be deleted' }, { status: 400 });
    const { error } = await admin.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
