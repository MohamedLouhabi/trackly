import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { OrgRole } from '@/lib/types';

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

/**
 * Workspace — what each organization *is*, as opposed to what it costs.
 * Read-only: renaming an org and transferring ownership both need their own
 * audited routes, so this states the facts rather than pretending to edit them.
 */
export default async function WorkspacePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, org_id, organizations(id, name, slug, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const orgs = (memberships ?? [])
    .map((m: any) => ({
      id: m.org_id as string,
      role: m.role as OrgRole,
      name: m.organizations?.name as string | undefined,
      slug: m.organizations?.slug as string | undefined,
      createdAt: m.organizations?.created_at as string | undefined,
    }))
    .filter((o) => o.name);

  // Counts per org, in parallel — each is an RLS-scoped head request.
  const cards = await Promise.all(
    orgs.map(async (o) => {
      const [{ count: projects }, { count: members }, { data: sub }] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('org_id', o.id),
        supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', o.id),
        supabase.from('subscriptions').select('plan, status').eq('org_id', o.id).maybeSingle(),
      ]);
      const active = sub?.status === 'active' || sub?.status === 'trialing';
      return {
        ...o,
        projects: projects ?? 0,
        members: members ?? 0,
        plan: active && sub?.plan === 'pro' ? 'Pro' : 'Free',
      };
    }),
  );

  if (orgs.length === 0) {
    return (
      <p className="empty">
        You don’t belong to an organization yet. <Link href="/onboarding">Create one</Link> to get a
        board, analytics and a plan.
      </p>
    );
  }

  return (
    <>
      {cards.map((org) => (
        <div key={org.id} className="plan-card">
          <div className="row">
            <h2>{org.name}</h2>
            <span className="paid free">{ROLE_LABELS[org.role]}</span>
            <span className="price" style={{ fontSize: 15 }}>
              {org.plan}
            </span>
          </div>

          <div className="seats">
            <div className="s-row">
              <span>Workspace URL</span>
              <span>/{org.slug}</span>
            </div>
            <div className="s-row">
              <span>Projects</span>
              <span>{org.projects}</span>
            </div>
            <div className="s-row">
              <span>Members</span>
              <span>{org.members}</span>
            </div>
            {org.createdAt && (
              <div className="s-row">
                <span>Created</span>
                <span>{longDate(org.createdAt)}</span>
              </div>
            )}
          </div>

          <div className="actions">
            <Link href={`/dashboard/${org.id}`} className="btn btn-secondary">
              Open board
            </Link>
            <Link href={`/dashboard/${org.id}/analytics`} className="btn btn-ghost">
              Analytics
            </Link>
            <span className="fine">
              {org.role === 'owner'
                ? 'You own this workspace.'
                : `Renaming is limited to the owner.`}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}
