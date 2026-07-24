'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Invite by email — the same route onboarding uses, reachable after setup. */
export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const res = await fetch('/api/private/org/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, email, role: form.get('role') }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(data.error ?? 'Could not send the invitation.');
      return;
    }
    setMsg(`Invitation created for ${email}.`);
    (e.target as HTMLFormElement).reset();
    router.refresh(); // pull the new row into the pending list
  }

  return (
    <form onSubmit={invite} className="inviterow">
      <input
        name="email"
        type="email"
        required
        placeholder="teammate@company.com"
        className="input"
        aria-label="Email to invite"
      />
      <select name="role" className="input" defaultValue="member" aria-label="Role">
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Sending…' : 'Invite'}
      </button>
      {err && <p className="err">{err}</p>}
      {msg && <p className="ok">{msg}</p>}
    </form>
  );
}
