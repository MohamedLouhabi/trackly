import { NextRequest } from 'next/server';
import { createTaskSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Please check the task details.', 400);
  }
  const { projectId, title, priority, assignee, dueDate } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Derive org_id from the project itself (never trust a client-sent org_id).
    // RLS on projects means a non-member gets no row back => 403.
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id')
      .eq('id', projectId)
      .maybeSingle();
    if (!project) return jsonError('You do not have access to this project.', 403);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        org_id: project.org_id,
        project_id: project.id,
        title,
        priority,
        assignee: assignee ?? null,
        due_date: dueDate ?? null,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[tasks] create error', error?.message);
      return jsonError('Could not create the task.', 400);
    }

    await logActivity(supabase, {
      orgId: project.org_id,
      actorId: user.id,
      action: 'task.created',
      entityType: 'task',
      entityId: data.id,
      metadata: { project_id: project.id, title: data.title },
    });

    return jsonOk({ task: data });
  } catch (err) {
    console.error('[tasks] create unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
