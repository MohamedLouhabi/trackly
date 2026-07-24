import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { setOrgPlan } from '@/lib/billing';
import { logActivity } from '@/lib/activity';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

const bodySchema = z.object({
  orgId: z.string().uuid(),
  action: z.enum(['upgrade', 'downgrade']),
});

/** Simulated billing change. Owner-only; the write itself runs through
 *  lib/billing.ts (the Stripe seam) with the service-role client, because
 *  subscriptions deliberately has no client write policy. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid request.', 400);
  const { orgId, action } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Owner check with the CALLER's RLS-bound client — a non-member sees no
    // row, a member sees their own role; only 'owner' may change the plan.
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || membership.role !== 'owner') {
      return jsonError('Only the organization owner can change the plan.', 403);
    }

    const plan = action === 'upgrade' ? 'pro' : 'free';
    const result = await setOrgPlan(orgId, plan);
    if (!result.ok) return jsonError(result.message, 400);

    await logActivity(supabase, {
      orgId,
      actorId: user.id,
      action: action === 'upgrade' ? 'billing.upgraded' : 'billing.downgraded',
      entityType: 'subscription',
      metadata: { plan },
    });

    return jsonOk({ plan });
  } catch (err) {
    console.error('[billing] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
