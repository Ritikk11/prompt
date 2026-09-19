export function hasStoredSupabaseSession() {
  if (typeof window === 'undefined') return false;

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i) || '';
      if (!key.includes('supabase') && !key.startsWith('sb-')) continue;

      const value = window.localStorage.getItem(key) || '';
      if (value.includes('access_token') || value.includes('refresh_token')) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}
