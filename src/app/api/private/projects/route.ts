import { NextRequest } from 'next/server';
import { createProjectSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAddProject } from '@/lib/billing';
import { logActivity } from '@/lib/activity';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Please enter a valid project name.', 400);
  }
  const { orgId, name, description } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Membership FIRST (RLS-bound read), so the limit check below can't be
    // used by outsiders to probe an org's project count.
    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) return jsonError('You do not have access to this organization.', 403);

    // Plan limit: Free = 3 projects per org.
    const gate = await canAddProject(orgId);
    if (!gate.ok) return jsonError(gate.message, 403);

    // RLS projects_insert_member re-checks is_org_member(orgId) AND
    // created_by = auth.uid(); a non-member insert is rejected by the DB.
    const { data, error } = await supabase
      .from('projects')
      .insert({ org_id: orgId, name, description: description ?? null, created_by: user.id })
      .select('id, org_id, name, description, created_at')
      .single();

    if (error || !data) {
      console.error('[projects] create error', error?.message);
      return jsonError('Could not create the project.', 403);
    }

    await logActivity(supabase, {
      orgId,
      actorId: user.id,
      action: 'project.created',
      entityType: 'project',
      entityId: data.id,
      metadata: { project_id: data.id, name: data.name },
    });

    return jsonOk({ project: data });
  } catch (err) {
    console.error('[projects] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
