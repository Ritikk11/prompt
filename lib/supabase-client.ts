import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Module-level singleton. @supabase/ssr@0.3.0 does NOT deduplicate instances
// (built-in singleton was only added in v0.5.0). Without this, every call to
// createClient() spawns a separate token-refresh timer + visibilitychange
// listener. When the user minimizes and reopens the tab, all instances race to
// rotate the refresh token — losers hold a stale token, their refresh fails,
// and Supabase fires SIGNED_OUT, wiping the admin session and any unsaved form
// data. Caching at the module level guarantees one client across the whole app.
let client: SupabaseClient | undefined;

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}
