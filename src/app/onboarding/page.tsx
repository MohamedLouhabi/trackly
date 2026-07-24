'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inputClass, buttonClass } from '@/components/AuthShell';

type Step = 'create' | 'invite';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('create');
  const [orgId, setOrgId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invites, setInvites] = useState<string[]>([]);

  async function createOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/private/org/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.get('name') }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not create the organization.');
      return;
    }
    setOrgId(data.org.id);
    setStep('invite');
  }

  async function sendInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const res = await fetch('/api/private/org/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, email, role: form.get('role') }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not send the invitation.');
      return;
    }
    setInvites((prev) => [...prev, email]);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      {step === 'create' ? (
        <>
          <h1 className="mb-2 text-[26px] font-semibold tracking-tight">Create your organization</h1>
          <p className="mb-6 text-sm text-neutral-600">
            This is the workspace your team will track projects in.
          </p>
          <form onSubmit={createOrg} className="space-y-4">
            <input
              name="name"
              placeholder="Organization name"
              required
              maxLength={120}
              className={inputClass}
            />
            {error && <p className="text-sm text-accent2-600">{error}</p>}
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? 'Creating…' : 'Create organization'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-[26px] font-semibold tracking-tight">Invite your team</h1>
          <p className="mb-6 text-sm text-neutral-600">
            Invitations are valid for 7 days. (Emails are logged to the server console for now.)
          </p>
          <form onSubmit={sendInvite} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="teammate@example.com"
              required
              className={inputClass}
            />
            <select name="role" defaultValue="member" className={inputClass}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            {error && <p className="text-sm text-accent2-600">{error}</p>}
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? 'Sending…' : 'Send invitation'}
            </button>
          </form>

          {invites.length > 0 && (
            <ul className="mt-6 space-y-1 text-sm text-neutral-600">
              {invites.map((email) => (
                <li key={email}>✓ Invited {email}</li>
              ))}
            </ul>
          )}

          <button
            onClick={() => {
              router.push('/dashboard');
              router.refresh();
            }}
            className="mt-8 w-full rounded-lg border border-divider bg-card px-3 py-2 text-sm font-semibold hover:bg-neutral-200"
          >
            Finish → Go to dashboard
          </button>
        </>
      )}
    </main>
  );
}
