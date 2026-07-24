import { NextRequest } from 'next/server';
import { createOrgSchema } from '@/lib/validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canCreateOrg } from '@/lib/billing';
import { jsonError, jsonOk, GENERIC_ERROR } from '@/lib/http';

// Turn a name into a url-safe slug matching the DB check constraint.
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const suffix = Math.random().toString(36).slice(2, 8); // avoid collisions
  return `${base || 'org'}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Please enter a valid organization name.', 400);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    // Plan limit: Free = 1 owned org (server-side, admin read — not spoofable).
    const gate = await canCreateOrg(user.id);
    if (!gate.ok) return jsonError(gate.message, 403);

    // created_by must equal auth.uid() (enforced again by RLS insert policy).
    // The on_organization_created trigger makes the caller 'owner' and adds
    // a free subscription.
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: parsed.data.name, slug: slugify(parsed.data.name), created_by: user.id })
      .select('id, slug')
      .single();

    if (error) {
      console.error('[org/create] error', error.message);
      return jsonError('Could not create the organization. Please try again.', 400);
    }

    return jsonOk({ org: data });
  } catch (err) {
    console.error('[org/create] unexpected', err);
    return jsonError(GENERIC_ERROR, 500);
  }
}
