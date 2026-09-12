import { createAdminClient } from '@/lib/supabase-admin';
import { fetchSettings } from '@/lib/data';
import type { User } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_USERNAME_REGEX = /^[a-z0-9_]{3,20}$/i;

function cleanProfileText(value: unknown, max = 160) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanPublicUrl(value: unknown) {
  const raw = cleanProfileText(value, 300);
  if (!raw) return '';
  try {
    const url = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function toPublicAuthUser(user: User, expectedUsername: string): User | null {
  const username = cleanProfileText(user.user_metadata?.username, 32).toLowerCase();
  if (!PUBLIC_USERNAME_REGEX.test(username) || username !== expectedUsername.toLowerCase()) return null;
  if (user.user_metadata?.profile_public !== true) return null;

  return {
    ...user,
    email: undefined,
    phone: undefined,
    user_metadata: {
      full_name: cleanProfileText(user.user_metadata?.full_name, 80) || 'Creator',
      username,
      bio: cleanProfileText(user.user_metadata?.bio, 200),
      avatar_url: cleanPublicUrl(user.user_metadata?.avatar_url),
      website: cleanPublicUrl(user.user_metadata?.website),
      profile_public: true,
    },
  } as User;
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/**
 * Fetch a user profile by either their Supabase auth UUID, public @username handle,
 * or editorial author ID (e.g. 'editorial-team').
 */
export async function getPublicUserByIdOrUsername(identifier: string): Promise<User | null> {
  let cleanId = '';
  try {
    cleanId = decodeURIComponent(identifier).trim().replace(/^@/, '');
  } catch {
    return null;
  }
  if (!cleanId) return null;

  const admin = createAdminClient();

  // Public auth profiles are reachable only by an explicit @username. UUID and
  // email-prefix lookup would let strangers enumerate private accounts.
  if (PUBLIC_USERNAME_REGEX.test(cleanId)) {
    try {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (!error && data?.users) {
        const normalizedTarget = cleanId.toLowerCase();
        const matched = data.users
          .map((u) => toPublicAuthUser(u, normalizedTarget))
          .find(Boolean);
        if (matched) return matched;
      }
    } catch (err) {
      console.error('Failed to resolve user by username:', err);
    }
  }

  // Lookup in settings.authors (e.g. editorial-team)
  try {
    const settings = await fetchSettings();
    const authors = settings.authors || [];
    const normalizedTarget = cleanId.toLowerCase();
    const authorMatch = authors.find(
      (a: any) =>
        (a.id || '').toLowerCase() === normalizedTarget ||
        (a.slug || '').toLowerCase() === normalizedTarget ||
        (a.name || '').toLowerCase() === normalizedTarget
    );
    if (authorMatch) {
      return {
        id: authorMatch.id,
        app_metadata: {},
        aud: 'authenticated',
        created_at: authorMatch.createdAt || '2026-06-25T15:17:07.365Z',
        email: 'editorial@promptmatrix.com',
        user_metadata: {
          full_name: authorMatch.name,
          username: authorMatch.slug || authorMatch.id,
          bio: authorMatch.bio || '',
          avatar_url: authorMatch.avatarUrl || '',
          website: authorMatch.website || '',
        },
      } as unknown as User;
    }
  } catch (err) {
    console.error('Failed to resolve author from settings:', err);
  }

  return null;
}
