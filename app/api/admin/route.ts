import { NextResponse } from 'next/server';
import { createClient as createUserClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { seedPosts, seedSections } from '@/lib/data/seedData';

const resources = new Set(['posts', 'sections', 'settings', 'seopages']);
const tableForResource: Record<string, string> = {
  posts: 'posts',
  sections: 'sections',
  settings: 'settings',
  seopages: 'seoPages',
};

async function getRequestUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    const admin = createAdminClient();
    return admin.auth.getUser(token);
  }

  const userClient = await createUserClient();
  return userClient.auth.getUser();
}

async function requireAdmin(request: Request) {
  const { data: { user }, error } = await getRequestUser(request);
  if (error || !user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data } = await admin.from('settings').select('data').eq('id', 'global').maybeSingle();
  const adminEmails = ((data?.data as any)?.adminEmails || []) as string[];
  if (adminEmails.length > 0 && !adminEmails.includes(user.email)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { admin, user };
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
    const { error } = await admin.from(table).upsert({ id: rowId, data });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { error } = await admin.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
