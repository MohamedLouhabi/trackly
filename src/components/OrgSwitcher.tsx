'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import type { OrgSummary } from '@/lib/types';

export function OrgSwitcher({
  orgs,
  currentOrgId,
}: {
  orgs: OrgSummary[];
  currentOrgId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = orgs.find((o) => o.id === currentOrgId);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="chip" style={{ maxWidth: 180 }}>
        <span className="truncate">{current?.name ?? 'Select org'}</span>
        <span style={{ color: 'var(--color-neutral-500)' }}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1.5 w-56 rounded-lg bg-card py-1 shadow-card-lg ring-1 ring-divider">
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setOpen(false);
                if (o.id !== currentOrgId) router.push(`/dashboard/${o.id}`);
              }}
              className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-neutral-200 ${
                o.id === currentOrgId ? 'font-semibold text-accent-800' : 'text-ink'
              }`}
            >
              <span className="truncate">{o.name}</span>
              <span className="ml-2 text-[10px] uppercase tracking-[0.06em] text-neutral-500">
                {o.role}
              </span>
            </button>
          ))}
          <div className="my-1 border-t border-divider" />
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full px-3.5 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-200 hover:text-ink"
          >
            + New organization
          </button>
        </div>
      )}
    </div>
  );
}
