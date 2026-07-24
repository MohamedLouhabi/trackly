import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Entry point after login. Sends the user to their first org's board, or to
 * onboarding if they have none. Actual org UI lives under /dashboard/[orgId].
 */
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but re-check server-side (defense in depth).
  if (!user) redirect('/login');

  // RLS ensures this only returns orgs the user is a member of.
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('org_id, created_at')
    .order('created_at', { ascending: true });

  if (!memberships || memberships.length === 0) {
    redirect('/onboarding');
  }

  redirect(`/dashboard/${memberships[0]!.org_id}`);
}
