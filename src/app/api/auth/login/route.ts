import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getClientIp,
  jsonError,
  jsonOk,
  GENERIC_ERROR,
  RATE_LIMITED,
  INVALID_CREDENTIALS,
} from '@/lib/http';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(INVALID_CREDENTIALS, 400);
  }
  const { email, password } = parsed.data;

  // Rate limit BEFORE hitting auth to blunt credential stuffing.
  const allowed = await checkRateLimit('login', getClientIp(req), email);
  if (!allowed) return jsonError(RATE_LIMITED, 429);

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[login] error', error.message);
      // Same message for wrong password / no such user / unconfirmed email.
      return jsonError(INVALID_CREDENTIALS, 401);
    }

    // Session is now set in httpOnly cookies by the ssr client.
    return jsonOk();
  } catch (err) {
    console.error('[login] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
