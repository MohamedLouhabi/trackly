import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { acceptInviteSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canAddMember } from '@/lib/billing';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Invalid or expired invitation.', 400);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return jsonError('Unauthorized', 401);

    // Look up the invite by hash using the admin client: the invitee is NOT
    // yet a member, so RLS would hide the row from their own session.
    const admin = createSupabaseAdminClient();
    const tokenHash = sha256(parsed.data.token);

    const { data: invite, error: findError } = await admin
      .from('invitations')
      .select('id, org_id, email, role, expires_at, accepted_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (findError) {
      console.error('[invite/accept] lookup error', findError.message);
      return jsonError(GENERIC_ERROR, 500);
    }

    // Generic message for every failure mode -> no token probing.
    if (
      !invite ||
      invite.accepted_at ||
      new Date(invite.expires_at) < new Date() ||
      // The signed-in user's email MUST match the invited email, so a
      // forwarded link can't be redeemed by the wrong account.
      invite.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return jsonError('Invalid or expired invitation.', 400);
    }

    // Plan limit re-check at accept time — the roster may have filled up
    // between invite and accept.
    const gate = await canAddMember(invite.org_id);
    if (!gate.ok) {
      return jsonError('This organization is full on its current plan.', 403);
    }

    // Add membership (admin insert: user isn't a member yet, can't self-add).
    const { error: memberError } = await admin
      .from('organization_members')
      .insert({ org_id: invite.org_id, user_id: user.id, role: invite.role });

    // 23505 = unique violation -> already a member; treat as success (idempotent).
    if (memberError && memberError.code !== '23505') {
      console.error('[invite/accept] member insert error', memberError.message);
      return jsonError('Could not accept the invitation.', 400);
    }

    // Mark the invite consumed (single-use).
    await admin
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    // Record it in the org activity log.
    await admin.from('activity_log').insert({
      org_id: invite.org_id,
      actor_id: user.id,
      action: 'invite.accepted',
      entity_type: 'invitation',
      entity_id: invite.id,
    });

    return jsonOk({ orgId: invite.org_id });
  } catch (err) {
    console.error('[invite/accept] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
