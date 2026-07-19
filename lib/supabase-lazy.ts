import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton for the browser Supabase client. Always-loaded components
// (Header, DataContext, PostContent) import THIS module so the ~48KB
// @supabase/* bundle stays out of the shared layout chunk and loads as its
// own async chunk after hydration. Rarely-visited pages that need Supabase
// immediately (login, admin, submit, profile) keep using the synchronous
// lib/supabase-client.ts.
let clientPromise: Promise<SupabaseClient> | null = null;

export function getSupabaseClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/ssr').then(({ createBrowserClient }) =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    );
  }
  return clientPromise;
}
