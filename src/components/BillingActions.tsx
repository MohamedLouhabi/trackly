'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BillingActions({
  orgId,
  plan,
  isOwner,
}: {
  orgId: string;
  plan: 'free' | 'pro';
  isOwner: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) {
    return <span className="fine">The owner manages billing.</span>;
  }

  async function change(action: 'upgrade' | 'downgrade') {
    if (
      action === 'downgrade' &&
      !confirm('Switch to Free? The 1 org · 3 projects · 5 members limits apply again.')
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch('/api/private/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, action }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not change the plan.');
      return;
    }
    router.refresh();
  }

  return (
    <>
      {plan === 'free' ? (
        <button onClick={() => change('upgrade')} disabled={loading} className="btn btn-primary">
          {loading ? 'Upgrading…' : 'Upgrade to Pro'}
        </button>
      ) : (
        <button onClick={() => change('downgrade')} disabled={loading} className="btn btn-ghost">
          {loading ? 'Switching…' : 'Switch to Free'}
        </button>
      )}
      {error && <span className="err">{error}</span>}
    </>
  );
}
