import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Log out and land the visitor back on the landing page.
 *
 * The topbar posts a plain HTML form, so the browser navigates to whatever
 * this returns: a JSON body would be shown as a page. 303 sends it on to "/"
 * with a GET, which also stops a refresh from re-posting the logout.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const res = NextResponse.redirect(new URL('/', req.url), { status: 303 });

  // signOut() clears the session through the cookie store; expire anything
  // still on the request as well, so a logout can never half-succeed.
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) res.cookies.delete(cookie.name);
  }
  return res;
}
