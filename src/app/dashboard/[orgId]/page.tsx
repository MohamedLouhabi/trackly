import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NewProjectForm } from '@/components/NewProjectForm';

export default async function OrgHomePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS: members only. Layout already verified membership.
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  const list = projects ?? [];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Projects</h1>
        <span className="page-meta">
          {list.length} {list.length === 1 ? 'project' : 'projects'}
        </span>
        <span className="spacer" style={{ flex: 1 }} />
        <NewProjectForm orgId={orgId} />
      </div>

      {list.length === 0 ? (
        <p className="empty">
          Nothing here yet. Create your first project and the board, analytics and activity feed
          will grow around it.
        </p>
      ) : (
        <div className="proj-grid">
          {list.map((p) => (
            <Link key={p.id} href={`/dashboard/${orgId}/projects/${p.id}`} className="proj-card">
              <p className="p-title">{p.name}</p>
              <p className="p-desc">{p.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
