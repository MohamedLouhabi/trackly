import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AppTopbar } from '@/components/AppTopbar';
import type { Member, OrgRole, OrgSummary } from '@/lib/types';
import '../../app-chrome.css';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Independent reads -> parallel (each Supabase query is a full network
  // round trip; serializing them is the main cost of a page render).
  const [{ data: memberships }, { data: memberRows }] = await Promise.all([
    // All orgs the user belongs to (RLS-scoped) -> switcher.
    supabase
      .from('organization_members')
      .select('role, org_id, organizations(id, name, slug)')
      .order('created_at', { ascending: true }),
    // Members of the current org + display names (co-member profile read).
    supabase.from('organization_members').select('user_id, role').eq('org_id', orgId),
  ]);

  const orgs: OrgSummary[] = (memberships ?? [])
    .map((m: any) => ({
      id: m.organizations?.id,
      name: m.organizations?.name,
      slug: m.organizations?.slug,
      role: m.role as OrgRole,
    }))
    .filter((o) => o.id)
    .filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);

  // Not a member of the requested org (or it doesn't exist under RLS) -> bounce.
  const currentMembership = (memberships ?? []).find((m: any) => m.org_id === orgId);
  if (!currentMembership) redirect('/dashboard');

  const ids = (memberRows ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ids)
    : { data: [] as { id: string; display_name: string | null }[] };

  const members: Member[] = (memberRows ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role as OrgRole,
    display_name: (profiles ?? []).find((p) => p.id === m.user_id)?.display_name ?? null,
  }));

  return (
    <div className="app min-h-screen bg-paper">
      <AppTopbar orgId={orgId} orgs={orgs} members={members} />
      <main className="main">{children}</main>
    </div>
  );
}
