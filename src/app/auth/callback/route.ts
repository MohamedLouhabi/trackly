import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * PKCE callback for email links (signup confirm + password recovery).
 * Supabase appends ?code=...; we exchange it for a cookie session, then
 * redirect to `next` (defaults to /dashboard).
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Only allow internal relative redirects (no open-redirect via ?next=).
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error('[auth/callback] exchange error', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
