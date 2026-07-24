'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewProjectForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/private/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        name: form.get('name'),
        description: form.get('description') || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not create the project.');
      return;
    }
    setOpen(false);
    router.push(`/dashboard/${orgId}/projects/${data.project.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        + New project
      </button>
    );
  }

  return (
    <div className="modal-scrim" onMouseDown={() => setOpen(false)}>
      <form
        onSubmit={onSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        className="modal"
        style={{ display: 'grid', gap: 'var(--space-4)' }}
      >
        <h2 style={{ margin: 0 }}>New project</h2>
        <div>
          <label className="field-label">Name</label>
          <input name="name" required maxLength={120} autoFocus className="input" />
        </div>
        <div>
          <label className="field-label">Description</label>
          <textarea name="description" maxLength={2000} rows={2} className="input" />
        </div>
        {error && <p className="err">{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
