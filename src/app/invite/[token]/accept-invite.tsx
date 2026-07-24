'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buttonClass } from '@/components/AuthShell';

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/private/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Invalid or expired invitation.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <button onClick={accept} disabled={loading} className={buttonClass}>
        {loading ? 'Joining…' : 'Accept invitation'}
      </button>
    </>
  );
}
