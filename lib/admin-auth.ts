import { NextResponse } from 'next/server';
import { createClient as createUserClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

const DEFAULT_OWNER_EMAILS = ['ritikkewat11@gmail.com'];

function parseEmailList(value?: string | string[]) {
  const source = Array.isArray(value) ? value.join(',') : value || '';
  return source
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getRequestUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    const admin = createAdminClient();
    return admin.auth.getUser(token);
  }

  const userClient = await createUserClient();
  return userClient.auth.getUser();
}

export async function requireAdmin(request: Request) {
  const { data: { user }, error } = await getRequestUser(request);
  if (error || !user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data, error: settingsError } = await admin.from('settings').select('data').eq('id', 'global').maybeSingle();
  if (settingsError) {
    return { error: NextResponse.json({ error: settingsError.message }, { status: 500 }) };
  }

  const settingsEmails = parseEmailList((data?.data as any)?.adminEmails || []);
  const envEmails = parseEmailList(process.env.ADMIN_EMAILS);
  const adminEmails = Array.from(new Set([...DEFAULT_OWNER_EMAILS, ...settingsEmails, ...envEmails]));

  if (adminEmails.length === 0) {
    return { error: NextResponse.json({ error: 'No admin owner is configured' }, { status: 403 }) };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { admin, user };
}
