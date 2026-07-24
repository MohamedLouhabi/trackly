import { NextRequest } from 'next/server';
import { signupSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, jsonError, jsonOk, GENERIC_ERROR, RATE_LIMITED } from '@/lib/http';

export async function POST(req: NextRequest) {
  // 1. Validate input with zod BEFORE anything else.
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Please check your details and try again.', 400);
  }
  const { email, password, displayName } = parsed.data;

  // 2. Rate limit per IP + email.
  const allowed = await checkRateLimit('signup', getClientIp(req), email);
  if (!allowed) return jsonError(RATE_LIMITED, 429);

  try {
    const supabase = await createSupabaseServerClient();

    // display_name flows into raw_user_meta_data; the profiles row is created
    // by the on_auth_user_created trigger, not here.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      // Log detail server-side; stay generic to the client (don't reveal if
      // an email is already registered -> user enumeration).
      console.error('[signup] error', error.message);
      return jsonError('Could not create the account. Please try again.', 400);
    }

    return jsonOk({ message: 'Check your email to confirm your account.' });
  } catch (err) {
    console.error('[signup] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
