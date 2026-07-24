import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client bound to the request's httpOnly cookies.
 * The session lives in cookies (never localStorage), so this is the only
 * place the user's auth state is read/written on the server.
 */
export async function createSupabaseServerClient() {
  // Next 15: cookies() is async.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled in middleware, so this is safe to ignore.
          }
        },
      },
    },
  );
}
