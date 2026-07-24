import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Billing & plan limits — THE single seam for payments.
 *
 * Everything plan-related funnels through this module: limit checks in API
 * routes, the /settings/billing overview, and the simulated upgrade. When
 * Stripe lands, only this file changes: setOrgPlan() becomes "create a
 * Checkout Session" + a webhook handler that performs today's update, and
 * the subscriptions table already carries stripe_customer_id /
 * stripe_subscription_id columns for it.
 *
 * Server-only: imports the service-role client (admin.ts throws in a browser
 * bundle). Limits are enforced here with admin reads so they cannot be
 * sidestepped by RLS edge cases — routes still do their own session checks.
 */

export type Plan = 'free' | 'pro';

export const PLAN_LIMITS: Record<Plan, { orgs: number | null; projects: number | null; members: number | null }> = {
  free: { orgs: 1, projects: 3, members: 5 },
  pro: { orgs: null, projects: null, members: null }, // null = unlimited
};

export const PLAN_PRICE_USD: Record<Plan, number> = { free: 0, pro: 8 };

export type Gate = { ok: true } | { ok: false; message: string };

let warnedNoKey = false;

/**
 * Every gate below asks the service-role client to count rows. With no valid
 * key those counts come back undefined and the comparisons pass — the limits
 * fail OPEN, exactly like rate limiting does, and for the same reason: a
 * half-configured dev environment shouldn't be an unusable one. The difference
 * is that this used to happen in total silence. Say it out loud, once per boot.
 */
function warnIfServiceKeyMissing(): void {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key && !key.startsWith('REPLACE')) return;
  if (warnedNoKey) return;
  warnedNoKey = true;
  console.warn('[billing] SUPABASE_SERVICE_ROLE_KEY not set — plan limits are NOT enforced');
}

/** Effective plan of an org. Non-active subscriptions count as free. */
export async function getOrgPlan(orgId: string): Promise<Plan> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('subscriptions')
    .select('plan, status')
    .eq('org_id', orgId)
    .maybeSingle();
  if (!data) return 'free';
  const active = data.status === 'active' || data.status === 'trialing';
  return active && data.plan === 'pro' ? 'pro' : 'free';
}

/** Free = 1 org you own. Owning only Pro orgs lifts the cap. */
export async function canCreateOrg(userId: string): Promise<Gate> {
  warnIfServiceKeyMissing();
  const admin = createSupabaseAdminClient();
  const { data: owned } = await admin
    .from('organization_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('role', 'owner');

  if (!owned || owned.length === 0) return { ok: true };

  for (const row of owned) {
    if ((await getOrgPlan(row.org_id)) === 'free') {
      return {
        ok: false,
        message: 'The Free plan includes 1 organization. Upgrade it to Pro to create more.',
      };
    }
  }
  return { ok: true };
}

/** Free = 3 projects per org. */
export async function canAddProject(orgId: string): Promise<Gate> {
  warnIfServiceKeyMissing();
  if ((await getOrgPlan(orgId)) === 'pro') return { ok: true };

  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const limit = PLAN_LIMITS.free.projects!;
  if ((count ?? 0) >= limit) {
    return {
      ok: false,
      message: `The Free plan includes ${limit} projects. Upgrade to Pro for unlimited projects.`,
    };
  }
  return { ok: true };
}

/** Free = 5 members per org. Checked at invite AND at accept. */
export async function canAddMember(orgId: string): Promise<Gate> {
  warnIfServiceKeyMissing();
  if ((await getOrgPlan(orgId)) === 'pro') return { ok: true };

  const admin = createSupabaseAdminClient();
  const { count } = await admin
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const limit = PLAN_LIMITS.free.members!;
  if ((count ?? 0) >= limit) {
    return {
      ok: false,
      message: `The Free plan includes ${limit} members. Upgrade to Pro for unlimited members.`,
    };
  }
  return { ok: true };
}

/**
 * Simulated plan change — the exact line Stripe will replace.
 * Pro runs on a 30-day simulated period; Free clears the period end.
 */
export async function setOrgPlan(orgId: string, plan: Plan): Promise<Gate> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('subscriptions')
    .update({
      plan,
      status: 'active',
      current_period_end:
        plan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    })
    .eq('org_id', orgId);

  if (error) {
    console.error('[billing] setOrgPlan error', error.message);
    return { ok: false, message: 'Could not change the plan. Please try again.' };
  }
  return { ok: true };
}

export interface OrgBilling {
  orgId: string;
  orgName: string;
  role: 'owner' | 'admin';
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  projectCount: number;
  memberCount: number;
}

/**
 * Billing overview for every org the user owns or administers.
 *
 * Deliberately takes the CALLER's RLS-bound client, not the service-role one:
 * every row read here (their memberships, their orgs' subscriptions, project
 * and member counts) is already permitted to members by RLS, so there is no
 * reason to reach for root privileges. Least privilege — and it keeps the
 * read path working without the service-role key.
 */
export async function getBillingOverview(
  supabase: SupabaseClient,
  userId: string,
): Promise<OrgBilling[]> {
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('org_id, role, organizations(name)')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin'])
    .order('created_at', { ascending: true });

  const out: OrgBilling[] = [];
  for (const m of memberships ?? []) {
    const orgId = m.org_id as string;

    const [{ data: sub }, { count: projectCount }, { count: memberCount }] = await Promise.all([
      supabase.from('subscriptions').select('plan, status, current_period_end').eq('org_id', orgId).maybeSingle(),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
      supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
    ]);

    const active = sub?.status === 'active' || sub?.status === 'trialing';
    out.push({
      orgId,
      orgName: (m as any).organizations?.name ?? 'Organization',
      role: m.role as 'owner' | 'admin',
      plan: active && sub?.plan === 'pro' ? 'pro' : 'free',
      status: sub?.status ?? 'active',
      currentPeriodEnd: sub?.current_period_end ?? null,
      projectCount: projectCount ?? 0,
      memberCount: memberCount ?? 0,
    });
  }
  return out;
}
