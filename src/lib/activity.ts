import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Append an entry to the org activity log as the current user.
 * Uses the caller's RLS-bound client: the insert policy forces
 * actor_id = auth.uid(), so a user can only log their own actions.
 * Best-effort — a logging failure must never break the primary action.
 */
export async function logActivity(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from('activity_log').insert({
    org_id: params.orgId,
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) console.error('[activity] insert failed', error.message);
}
