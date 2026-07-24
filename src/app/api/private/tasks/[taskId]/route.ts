import { NextRequest } from 'next/server';
import { z } from 'zod';
import { updateTaskSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

const paramsSchema = z.object({ taskId: z.string().uuid() });

// -------- PATCH: move (status) or edit fields --------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const p = paramsSchema.safeParse(await params);
  if (!p.success) return jsonError('Not found.', 404);

  const body = await req.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid update.', 400);

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Map camelCase input -> DB columns; only set provided fields.
    const patch: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;
    if (parsed.data.assignee !== undefined) patch.assignee = parsed.data.assignee;
    if (parsed.data.dueDate !== undefined) patch.due_date = parsed.data.dueDate;

    // SERVER-VERIFIED PERMISSION: the update runs under RLS tasks_update_member,
    // which requires is_org_member(org_id). A non-member (or someone acting on a
    // task outside their org) matches 0 rows -> null result -> 403. This check
    // happens on EVERY move, not just the initial page load.
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', p.data.taskId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[tasks] patch error', error.message);
      return jsonError(GENERIC_ERROR, 500);
    }
    if (!data) {
      return jsonError('You do not have permission to modify this task.', 403);
    }

    if (parsed.data.status !== undefined) {
      await logActivity(supabase, {
        orgId: data.org_id,
        actorId: user.id,
        action: 'task.moved',
        entityType: 'task',
        entityId: data.id,
        metadata: { project_id: data.project_id, to: data.status, title: data.title },
      });
    }

    return jsonOk({ task: data });
  } catch (err) {
    console.error('[tasks] patch unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}

// -------- DELETE: owner/admin only --------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const p = paramsSchema.safeParse(await params);
  if (!p.success) return jsonError('Not found.', 404);

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Read first (member select) for logging context.
    const { data: task } = await supabase
      .from('tasks')
      .select('id, org_id, project_id, title')
      .eq('id', p.data.taskId)
      .maybeSingle();
    if (!task) return jsonError('Not found.', 404);

    // RLS tasks_delete_admin => owner/admin only. Empty result => blocked => 403.
    const { data: deleted, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', p.data.taskId)
      .select('id');

    if (error) {
      console.error('[tasks] delete error', error.message);
      return jsonError(GENERIC_ERROR, 500);
    }
    if (!deleted || deleted.length === 0) {
      return jsonError('Only admins or owners can delete tasks.', 403);
    }

    await logActivity(supabase, {
      orgId: task.org_id,
      actorId: user.id,
      action: 'task.deleted',
      entityType: 'task',
      entityId: task.id,
      metadata: { project_id: task.project_id, title: task.title },
    });

    return jsonOk();
  } catch (err) {
    console.error('[tasks] delete unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
