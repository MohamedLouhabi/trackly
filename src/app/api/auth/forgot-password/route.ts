import { NextRequest } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, jsonError, jsonOk, RATE_LIMITED } from '@/lib/http';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  // Even on bad input we return the same generic response below to avoid
  // leaking whether an email is registered.
  const genericResponse = jsonOk({
    message: 'If that email exists, a reset link is on its way.',
  });

  if (!parsed.success) return genericResponse;
  const { email } = parsed.data;

  const allowed = await checkRateLimit('forgot', getClientIp(req), email);
  if (!allowed) return jsonError(RATE_LIMITED, 429);

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    });
  } catch (err) {
    // Swallow + log: never tell the client whether the send succeeded.
    console.error('[forgot-password] error', err);
  }

  return genericResponse;
}
