import { createSupabaseServerClient } from '@/lib/supabase/server';
import { jsonOk } from '@/lib/http';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return jsonOk();
}
