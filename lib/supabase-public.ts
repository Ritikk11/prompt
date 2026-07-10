import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cookie-free anon client for public content reads (posts, sections, settings, seoPages).
// Unlike lib/supabase-server.ts, this does not call next/headers cookies(), so pages
// using it are eligible for ISR instead of being forced into dynamic rendering.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
