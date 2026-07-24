import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { isAdminRole, type Member, type OrgRole, type ActivityItem } from '@/lib/types';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Independent reads -> parallel: 4 round trips become 1 wall-clock hop.
  const [{ data: project }, { data: tasks }, { data: memberRows }, { data: activities }] =
    await Promise.all([
      // Project must exist AND belong to this org (RLS also enforces membership).
      supabase
        .from('projects')
        .select('id, org_id, name, description')
        .eq('id', projectId)
        .eq('org_id', orgId)
        .maybeSingle(),
      // Tasks for this project (RLS: members only).
      supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
      // Members: memberships + their profile display names (co-member read policy).
      supabase.from('organization_members').select('user_id, role').eq('org_id', orgId),
      // Per-project activity (metadata.project_id filter).
      supabase
        .from('activity_log')
        .select('id, actor_id, action, entity_type, entity_id, metadata, created_at')
        .eq('org_id', orgId)
        .filter('metadata->>project_id', 'eq', projectId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
  if (!project) notFound();

  const ids = (memberRows ?? []).map((m) => m.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ids)
    : { data: [] as { id: string; display_name: string | null }[] };

  const members: Member[] = (memberRows ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role as OrgRole,
    display_name: (profiles ?? []).find((p) => p.id === m.user_id)?.display_name ?? null,
  }));

  // Current user's role in this org -> gate the delete UI (server re-verifies).
  const myRole = members.find((m) => m.user_id === user.id)?.role;
  const canDelete = isAdminRole(myRole);

  const openCount = (tasks ?? []).filter(
    (t) => t.status === 'todo' || t.status === 'in_progress',
  ).length;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{project.name}</h1>
        <span className="page-meta">{openCount} open</span>
        {project.description && (
          <p className="page-meta" style={{ width: '100%', margin: 0 }}>
            {project.description}
          </p>
        )}
      </div>

      <div className="board-with-rail">
        <KanbanBoard
          projectId={project.id}
          initialTasks={tasks ?? []}
          members={members}
          canDelete={canDelete}
          currentUserId={user.id}
        />
        <aside>
          <ActivityFeed items={(activities ?? []) as ActivityItem[]} members={members} />
        </aside>
      </div>
    </>
  );
}
