import { NextRequest } from 'next/server';
import { deleteAccountSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Please type DELETE to confirm.', 400);
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Identify the caller from the server session ONLY.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    // Deleting an auth user requires admin privileges. We delete ONLY the
    // authenticated caller's own id (from the verified session), so an
    // attacker cannot delete someone else's account. Cascades remove the
    // profile + memberships via FK on delete cascade.
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('[delete-account] error', error.message);
      return jsonError('Could not delete the account. Please try again.', 400);
    }

    // Clear the now-orphaned session cookies.
    await supabase.auth.signOut();

    return jsonOk({ message: 'Account deleted.' });
  } catch (err) {
    console.error('[delete-account] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
