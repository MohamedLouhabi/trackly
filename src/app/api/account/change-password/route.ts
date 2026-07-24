import { NextRequest } from 'next/server';
import { changePasswordSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Password must be at least 10 characters with a letter and a number.', 400);
  }
  const { currentPassword, newPassword } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();

    // Server-side session check — never trust a client-sent user id.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return jsonError('Unauthorized', 401);
    }

    // Re-authenticate with the current password before allowing a change.
    // Supabase updateUser() does NOT verify the old password on its own.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthError) {
      return jsonError('Current password is incorrect.', 400);
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      console.error('[change-password] update error', updateError.message);
      return jsonError('Could not update the password. Please try again.', 400);
    }

    return jsonOk({ message: 'Password updated.' });
  } catch (err) {
    console.error('[change-password] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
