import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const LIMIT = 5;
const WINDOW_SECONDS = 15 * 60; // 15 minutes

let warnedNoKey = false;

/**
 * Returns true if the action is allowed, false if the caller is over the cap.
 * Keyed by action + IP + email so one attacker can't lock out an entire IP
 * for every account, nor probe one account from many IPs unthrottled.
 *
 * Uses the service_role client to invoke check_rate_limit() (SECURITY DEFINER),
 * because the rate_limits table is intentionally unreachable by anon/authenticated.
 * Fails OPEN on infra error (never lock out real users because the DB hiccuped),
 * but logs it server-side.
 */
export async function checkRateLimit(
  action: string,
  ip: string,
  email: string,
): Promise<boolean> {
  // Fail fast (open) when the service key isn't configured yet — otherwise
  // every login/signup pays for a doomed network round trip before failing
  // open anyway. Remove-me-when-configured is logged once per boot.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.startsWith('REPLACE')) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      console.warn('[rate-limit] SUPABASE_SERVICE_ROLE_KEY not set — rate limiting is OFF');
    }
    return true;
  }

  const key = `${action}:${ip}:${email}`;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.rpc('check_rate_limit', {
      _key: key,
      _limit: LIMIT,
      _window_seconds: WINDOW_SECONDS,
    });
    if (error) {
      console.error('[rate-limit] rpc error', error.message);
      return true; // fail open
    }
    return data === true;
  } catch (err) {
    console.error('[rate-limit] unexpected error', err);
    return true; // fail open
  }
}
