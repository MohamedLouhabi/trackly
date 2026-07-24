import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client. Uses ONLY the public anon key + cookies.
 * No service_role, no secrets. Used for client-side session reads.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
