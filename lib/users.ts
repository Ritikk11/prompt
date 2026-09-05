import { createAdminClient } from '@/lib/supabase-admin';
import { fetchSettings } from '@/lib/data';
import type { User } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/**
 * Fetch a user profile by either their Supabase auth UUID, public @username handle,
 * or editorial author ID (e.g. 'editorial-team').
 */
export async function getPublicUserByIdOrUsername(identifier: string): Promise<User | null> {
  const cleanId = decodeURIComponent(identifier).trim().replace(/^@/, '');
  if (!cleanId) return null;

  const admin = createAdminClient();

  // 1. Direct UUID lookup in auth.users
  if (isUuid(cleanId)) {
    try {
      const { data, error } = await admin.auth.admin.getUserById(cleanId);
      if (!error && data?.user) {
        return data.user;
      }
    } catch {
      // Fall through to search if UUID lookup fails
    }
  }

  // 2. Lookup by username in auth.users user_metadata
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (!error && data?.users) {
      const normalizedTarget = cleanId.toLowerCase();
      const matched = data.users.find(u => {
        const uName = (u.user_metadata?.username || '').toLowerCase();
        const emailPrefix = (u.email?.split('@')[0] || '').toLowerCase();
        return uName === normalizedTarget || emailPrefix === normalizedTarget;
      });
      if (matched) return matched;
    }
  } catch (err) {
    console.error('Failed to resolve user by username:', err);
  }

  // 3. Lookup in settings.authors (e.g. editorial-team)
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
