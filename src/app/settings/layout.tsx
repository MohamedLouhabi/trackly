import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Brandmark } from '@/components/Brandmark';
import { SettingsNav } from '@/components/SettingsNav';
import '../app-chrome.css';

/**
 * Shell for every settings section — one topbar, one sidebar, one panel.
 *
 * Each section page renders only its own blocks; the chrome lives here so
 * Workspace, Members, Billing and Account can't drift apart visually.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // The oldest membership names the workspace in the page meta and gives the
  // org-scoped Board / Analytics links something to point at.
  const { data: firstMembership } = await supabase
    .from('organization_members')
    .select('org_id, organizations(name)')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = firstMembership?.org_id as string | undefined;
  const orgName = (firstMembership as any)?.organizations?.name as string | undefined;

  return (
    <div className="app min-h-screen bg-paper">
      <header className="topbar">
        <Link href="/dashboard" className="brandmark" aria-label="Trackly">
          <Brandmark height={22} />
        </Link>
        <nav>
          <Link href={orgId ? `/dashboard/${orgId}` : '/dashboard'}>Board</Link>
          {orgId && <Link href={`/dashboard/${orgId}/analytics`}>Analytics</Link>}
          <Link href="/settings/workspace" aria-current="page">
            Settings
          </Link>
        </nav>
        <span className="spacer" />
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn btn-ghost">
            Log out
          </button>
        </form>
      </header>

      <main className="main">
        <div className="page-head">
          <h1 className="page-title">Settings</h1>
          <span className="page-meta">{orgName ? `${orgName} workspace` : 'Your account'}</span>
        </div>

        <div className="settings">
          <SettingsNav />
          <div className="panel">{children}</div>
        </div>
      </main>
    </div>
  );
}
