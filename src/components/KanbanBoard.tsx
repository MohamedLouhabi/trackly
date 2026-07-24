'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BOARD_COLUMNS,
  type Member,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/types';
import { initialsOf } from './AppTopbar';
import { TaskModal } from './TaskModal';

/* Identity: priority is a 3px stripe of ink on the card's left edge —
   magenta only for high/urgent, cyan for medium, neutral otherwise. */
function stripeOf(p: TaskPriority): string {
  if (p === 'high' || p === 'urgent') return 'p-high';
  if (p === 'medium') return 'p-med';
  return '';
}

const LANE_DOT: Record<string, string> = {
  todo: 'dot-off',
  in_progress: 'dot-on',
  done: 'dot-off',
};

const AV = ['av-a', 'av-b', 'av-c', 'av-d'];

type Filter = 'all' | 'mine' | 'high';

export function KanbanBoard({
  projectId,
  initialTasks,
  members,
  canDelete,
  currentUserId,
}: {
  projectId: string;
  initialTasks: Task[];
  members: Member[];
  canDelete: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Reconcile with server data after router.refresh() (create/delete/move).
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const memberIndex = (userId: string | null) =>
    Math.max(0, members.findIndex((m) => m.user_id === userId));
  const nameFor = (userId: string | null) =>
    userId ? members.find((m) => m.user_id === userId)?.display_name ?? 'Member' : null;

  const visible = useMemo(() => {
    if (filter === 'mine') return tasks.filter((t) => t.assignee === currentUserId);
    if (filter === 'high') return tasks.filter((t) => t.priority === 'high' || t.priority === 'urgent');
    return tasks;
  }, [tasks, filter, currentUserId]);

  async function moveTask(taskId: string, to: TaskStatus) {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === to) return;

    // Optimistic: apply locally first.
    const snapshot = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: to } : t)));
    setError(null);

    const res = await fetch(`/api/private/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: to }),
    });

    if (!res.ok) {
      // Server rejected the move (e.g. permission) -> revert.
      setTasks(snapshot);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not move the task.');
      return;
    }
    // Sync server-rendered pieces (activity feed) without losing board state.
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId)); // optimistic
    setError(null);

    const res = await fetch(`/api/private/tasks/${taskId}`, { method: 'DELETE' });
    if (!res.ok) {
      setTasks(snapshot);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not delete the task.');
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="filters" style={{ marginLeft: 0, marginBottom: 'var(--space-4)' }}>
        <button type="button" className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        <button type="button" className={`chip ${filter === 'mine' ? 'on' : ''}`} onClick={() => setFilter('mine')}>
          Mine
        </button>
        <button type="button" className={`chip ${filter === 'high' ? 'on' : ''}`} onClick={() => setFilter('high')}>
          <span className="dot dot-warn" style={{ width: 6, height: 6 }} /> High priority
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginLeft: 'var(--space-2)' }}
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
        >
          + New card
        </button>
        {error && <p className="err" style={{ marginLeft: 'var(--space-3)' }}>{error}</p>}
      </div>

      <div className="board">
        {BOARD_COLUMNS.map((col) => {
          const colTasks = visible.filter((t) => t.status === col.key);
          const isOver = dragOver === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                if (dragId) moveTask(dragId, col.key);
                setDragId(null);
              }}
            >
              <p className="lane-name">
                <span className={`dot ${LANE_DOT[col.key]}`} />
                {col.label} <span className="lane-count">{colTasks.length}</span>
              </p>

              <div className="lane">
                {colTasks.map((t) => {
                  const overdue =
                    t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => {
                        setEditingTask(t);
                        setModalOpen(true);
                      }}
                      className={`kcard ${stripeOf(t.priority)} ${dragId === t.id ? 'drag' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <p className="kt" style={{ flex: 1 }}>{t.title}</p>
                        {canDelete && (
                          <button
                            className="kdel"
                            aria-label="Delete task"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(t.id);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {(t.priority === 'high' || t.priority === 'urgent') && (
                        <span className="tagline hot">
                          <span className="dot dot-warn" style={{ width: 6, height: 6 }} />
                          {t.priority === 'urgent' ? 'urgent' : 'high priority'}
                        </span>
                      )}

                      <div className="krow">
                        <span className="kid" style={overdue ? { color: 'var(--color-accent-2-700)' } : undefined}>
                          {t.due_date
                            ? `${overdue ? 'overdue · ' : 'due '}${new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                            : ''}
                        </span>
                        {t.assignee && (
                          <span className="avatars">
                            <span
                              className={`avatar ${AV[memberIndex(t.assignee) % AV.length]}`}
                              title={nameFor(t.assignee) ?? undefined}
                            >
                              {initialsOf(nameFor(t.assignee))}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isOver && <div className="dropslot" aria-hidden="true" />}

                <button
                  className="add"
                  onClick={() => {
                    setEditingTask(null);
                    setModalOpen(true);
                  }}
                >
                  + Add a card
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <TaskModal
          projectId={projectId}
          members={members}
          task={editingTask}
          onClose={() => setModalOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
