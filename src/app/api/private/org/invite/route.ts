import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { inviteSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAddMember } from '@/lib/billing';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

// Raw token goes in the emailed link; only its SHA-256 hash is stored.
function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Please enter a valid email and role.', 400);
  }
  const { orgId, email, role } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Membership precheck (RLS-bound) so outsiders can't probe member counts.
    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) return jsonError('You do not have access to this organization.', 403);

    // Plan limit: Free = 5 members per org (re-checked again at accept time).
    const gate = await canAddMember(orgId);
    if (!gate.ok) return jsonError(gate.message, 403);

    const rawToken = randomBytes(32).toString('base64url'); // ~256 bits entropy
    const tokenHash = sha256(rawToken);

    // The RLS insert policy re-checks that the caller is owner/admin of orgId
    // AND that invited_by = auth.uid(); a non-admin insert is rejected by the DB.
    const { error } = await supabase.from('invitations').insert({
      org_id: orgId,
      email,
      role,
      token_hash: tokenHash,
      invited_by: user.id,
    });

    if (error) {
      console.error('[org/invite] error', error.message);
      return jsonError('Could not send the invitation.', 400);
    }

    // Email sending is stubbed: log the accept link to the server console.
    const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${rawToken}`;
    console.log(`[invite] to=${email} role=${role} org=${orgId} link=${acceptUrl}`);

    return jsonOk({ message: 'Invitation sent.' });
  } catch (err) {
    console.error('[org/invite] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
