import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Page prefixes that require auth -> unauthenticated users are redirected.
const PROTECTED_PAGES = ['/dashboard', '/account', '/onboarding', '/settings'];
// API prefixes that require auth -> unauthenticated users get a 401 JSON.
const PROTECTED_APIS = ['/api/private'];

export async function middleware(req: NextRequest) {
  // Response we can mutate cookies on (session refresh writes here).
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the JWT against Supabase Auth — do not
  // trust getSession() alone in middleware.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  const isProtectedApi = PROTECTED_APIS.some((p) => pathname.startsWith(p));
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));

  if (!user && isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user && isProtectedPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  // Run on protected areas + refresh session everywhere except static assets.
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/api/private/:path*',
  ],
};
