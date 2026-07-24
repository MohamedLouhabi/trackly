import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AcceptInvite } from './accept-invite';

/**
 * Accept page. Requires a logged-in user whose email matches the invite
 * (verified server-side in the accept route). Not under a protected prefix,
 * so we guard here and bounce guests to /login with a return path.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/invite/${encodeURIComponent(token)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 text-center shadow-card-md">
        <h1 className="mb-2 text-xl font-semibold">You&apos;ve been invited</h1>
        <p className="mb-6 text-sm text-neutral-600">
          Accept to join the organization as {user.email}.
        </p>
        <AcceptInvite token={token} />
      </div>
    </main>
  );
}
