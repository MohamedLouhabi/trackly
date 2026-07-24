import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

const paramsSchema = z.object({ projectId: z.string().uuid() });

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return jsonError('Not found.', 404);
  const { projectId } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Fetch first (RLS select = member) so we have org_id/name for the log.
    const { data: project } = await supabase
      .from('projects')
      .select('id, org_id, name')
      .eq('id', projectId)
      .maybeSingle();
    if (!project) return jsonError('Not found.', 404);

    // RLS projects_delete_admin => only owner/admin. .select() returns the
    // deleted rows; empty array means the policy blocked it => 403.
    const { data: deleted, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .select('id');

    if (error) {
      console.error('[projects] delete error', error.message);
      return jsonError(GENERIC_ERROR, 500);
    }
    if (!deleted || deleted.length === 0) {
      return jsonError('You do not have permission to delete this project.', 403);
    }

    await logActivity(supabase, {
      orgId: project.org_id,
      actorId: user.id,
      action: 'project.deleted',
      entityType: 'project',
      entityId: project.id,
      metadata: { project_id: project.id, name: project.name },
    });

    return jsonOk();
  } catch (err) {
    console.error('[projects] delete unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
