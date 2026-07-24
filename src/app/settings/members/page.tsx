import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InviteMemberForm } from '@/components/InviteMemberForm';
import { isAdminRole, type OrgRole } from '@/lib/types';

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const AV = ['av-a', 'av-b', 'av-c', 'av-d'];

/* Local copy on purpose: AppTopbar's version lives in a client module and
   can't be called during a server render. */
function initials(name: string | null): string {
  if (!name) return '·';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default async function MembersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: mine } = await supabase
    .from('organization_members')
    .select('role, org_id, organizations(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const orgs = (mine ?? [])
    .map((m: any) => ({
      id: m.org_id as string,
      role: m.role as OrgRole,
      name: (m.organizations?.name as string) ?? 'Organization',
    }))
    .filter((o) => o.id);

  if (orgs.length === 0) {
    return <p className="empty">You don’t belong to an organization yet.</p>;
  }

  // Everyone in each org + the still-open invitations (RLS lets members read
  // both; the token hash never leaves the database).
  const cards = await Promise.all(
    orgs.map(async (org) => {
      const [{ data: rows }, { data: invites }] = await Promise.all([
        supabase.from('organization_members').select('user_id, role').eq('org_id', org.id),
        supabase
          .from('invitations')
          .select('id, email, role, expires_at')
          .eq('org_id', org.id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: true }),
      ]);

      const ids = (rows ?? []).map((r) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from('profiles').select('id, display_name').in('id', ids)
        : { data: [] as { id: string; display_name: string | null }[] };

      const members = (rows ?? [])
        .map((r) => ({
          userId: r.user_id as string,
          role: r.role as OrgRole,
          name: (profiles ?? []).find((p) => p.id === r.user_id)?.display_name ?? null,
        }))
        .sort((a, b) => {
          const rank = { owner: 0, admin: 1, member: 2 };
          return rank[a.role] - rank[b.role];
        });

      return { ...org, members, invites: invites ?? [] };
    }),
  );

  return (
    <>
      {cards.map((org) => (
        <div key={org.id} className="block">
          <h3>{org.name}</h3>
          <p className="b-sub">
            {org.members.length} {org.members.length === 1 ? 'member' : 'members'}
            {org.invites.length > 0 && ` · ${org.invites.length} invitation pending`}
          </p>

          <div className="mlist">
            {org.members.map((m, j) => (
              <div key={m.userId} className="mrow">
                <span className={`avatar ${AV[j % AV.length]}`}>{initials(m.name)}</span>
                <span className="mname">
                  {m.name ?? 'Member'}
                  {m.userId === user.id && ' (you)'}
                </span>
                <span className="mrole">{ROLE_LABELS[m.role]}</span>
              </div>
            ))}

            {org.invites.map((inv: any) => (
              <div key={inv.id} className="mrow pending">
                <span className="avatar av-b">✉</span>
                <span className="mname">{inv.email}</span>
                <span className="mrole">
                  {ROLE_LABELS[inv.role as OrgRole]} · invited, expires {shortDate(inv.expires_at)}
                </span>
              </div>
            ))}
          </div>

          {isAdminRole(org.role) ? (
            <InviteMemberForm orgId={org.id} />
          ) : (
            <p className="fine" style={{ fontSize: 12.5, color: 'var(--color-neutral-600)' }}>
              Owners and admins can invite people.
            </p>
          )}
        </div>
      ))}

      <p className="b-sub" style={{ margin: 0 }}>
        Invitations are single-use and expire after seven days. Until transactional email is wired
        up, the accept link is written to the server log.
      </p>
    </>
  );
}
