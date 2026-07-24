import { createClient } from '@supabase/supabase-js';

/**
 * SERVICE-ROLE client. Bypasses RLS entirely — treat as root.
 *
 * Only import this from server-only API routes ("audited admin routes"):
 *   - rate limiting (rate_limits table is locked to clients)
 *   - deleting a user (auth.admin.deleteUser)
 *   - accepting an invite (inserting a membership for a not-yet-member)
 *
 * NEVER import in a client component. The runtime guard below throws if this
 * module is ever evaluated in a browser bundle, and the key has no
 * NEXT_PUBLIC_ prefix so it is never sent to the client.
 */
if (typeof window !== 'undefined') {
  throw new Error('supabase/admin.ts must never be imported in the browser');
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
