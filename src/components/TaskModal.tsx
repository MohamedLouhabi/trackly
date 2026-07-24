'use client';

import { useState } from 'react';
import type { Member, Task, TaskPriority } from '@/lib/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/**
 * Create (task = null) or edit (task provided) modal.
 * On save it calls back to the board, which owns the network + optimistic state.
 */
export function TaskModal({
  projectId,
  members,
  task,
  onClose,
  onSaved,
}: {
  projectId: string;
  members: Member[];
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(task);
  const [title, setTitle] = useState(task?.title ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [assignee, setAssignee] = useState<string>(task?.assignee ?? '');
  const [dueDate, setDueDate] = useState<string>(task?.due_date ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      priority,
      assignee: assignee || null,
      dueDate: dueDate || null,
    };

    const res = isEdit
      ? await fetch(`/api/private/tasks/${task!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/private/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...payload }),
        });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not save the task.');
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit card' : 'New card'}</h2>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <label className="field-label">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              autoFocus
              className="input"
            />
          </div>

          <div>
            <label className="field-label">Assignee</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="input">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name ?? 'Member'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1 }}>
              <label className="field-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="input"
                style={{ textTransform: 'capitalize' }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} style={{ textTransform: 'capitalize' }}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="field-label">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {error && <p className="err">{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving…' : isEdit ? 'Save' : 'Create card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
