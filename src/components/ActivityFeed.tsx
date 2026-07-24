import type { ActivityItem, Member } from '@/lib/types';

// Human-readable line per activity action.
function describe(item: ActivityItem): string {
  const title = (item.metadata?.title as string) ?? 'a task';
  switch (item.action) {
    case 'task.created':
      return `created “${title}”`;
    case 'task.moved':
      return `moved “${title}” to ${String(item.metadata?.to ?? '').replace('_', ' ')}`;
    case 'task.deleted':
      return `deleted “${title}”`;
    case 'project.created':
      return `created this project`;
    case 'invite.accepted':
      return `joined the organization`;
    case 'billing.upgraded':
      return `upgraded the workspace to Pro`;
    case 'billing.downgraded':
      return `switched the workspace to Free`;
    default:
      return item.action;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityFeed({
  items,
  members,
}: {
  items: ActivityItem[];
  members: Member[];
}) {
  const nameFor = (id: string | null) =>
    id ? members.find((m) => m.user_id === id)?.display_name ?? 'Someone' : 'Someone';

  return (
    <div className="rail">
      <h3>Activity</h3>
      {items.length === 0 ? (
        <p className="when">No activity yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span className="who">{nameFor(item.actor_id)}</span>{' '}
              <span style={{ color: 'var(--color-neutral-600)' }}>{describe(item)}</span>{' '}
              <span className="when">· {timeAgo(item.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
