import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  AnalyticsCharts,
  type WeekPoint,
  type NamedCount,
} from '@/components/AnalyticsCharts';
import { Donut, Sparkline } from '@/components/StatGraphics';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  archived: 'Archived',
};

/** Monday of the week `offset` weeks before the current week (UTC-naive). */
function weekStart(offset: number): Date {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - offset * 7);
  return monday;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Mean of the weekly medians present in a slice — null when the slice is empty. */
function avg(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return present.reduce((s, v) => s + v, 0) / present.length;
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();

  // Layout verified membership; the views run security_invoker, so the
  // caller's RLS on tasks applies to every row below.
  const eightWeeksAgo = isoDate(weekStart(7));

  const [{ data: weeklyRows }, { data: detailRows }, { data: statusRows }, { data: memberRows }, { data: overdueRow }] =
    await Promise.all([
      supabase
        .from('analytics_completed_per_week')
        .select('week_start, completed_count')
        .eq('org_id', orgId)
        .gte('week_start', eightWeeksAgo),
      // 008. Kept as its own read: if that migration hasn't run yet the priority
      // split and cycle trend go quiet, but the rest of the page still renders.
      supabase
        .from('analytics_weekly_detail')
        .select('week_start, high_count, median_cycle_days')
        .eq('org_id', orgId)
        .gte('week_start', eightWeeksAgo),
      supabase.from('analytics_tasks_by_status').select('status, task_count').eq('org_id', orgId),
      supabase
        .from('analytics_member_completion')
        .select('user_id, completed_count, assigned_count')
        .eq('org_id', orgId),
      supabase.from('analytics_overdue').select('overdue_count').eq('org_id', orgId).maybeSingle(),
    ]);

  // Zero-filled 8-week series, oldest → current; the current week is the
  // emphasized figure (cyan), everything else is the neutral ground series.
  const weekly: WeekPoint[] = Array.from({ length: 8 }, (_, i) => {
    const start = weekStart(7 - i);
    const iso = isoDate(start);
    const row = (weeklyRows ?? []).find((r) => r.week_start === iso);
    const detail = (detailRows ?? []).find((r) => r.week_start === iso);
    const count = row?.completed_count ?? 0;
    const high = Math.min(detail?.high_count ?? 0, count);
    return {
      week: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
      high,
      normal: count - high,
      cycle:
        typeof detail?.median_cycle_days === 'number'
          ? Math.round(detail.median_cycle_days * 10) / 10
          : null,
      current: i === 7,
    };
  });

  const byStatus: NamedCount[] = ['todo', 'in_progress', 'done', 'archived']
    .map((s) => ({
      name: STATUS_LABELS[s] ?? s,
      count: (statusRows ?? []).find((r) => r.status === s)?.task_count ?? 0,
    }))
    .filter((r) => r.count > 0 || ['To do', 'In progress', 'Done'].includes(r.name));

  // Names for member completion (co-member profile read policy).
  const ids = (memberRows ?? []).map((r) => r.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ids)
    : { data: [] as { id: string; display_name: string | null }[] };

  const perMember: NamedCount[] = (memberRows ?? [])
    .map((r) => ({
      name: (profiles ?? []).find((p) => p.id === r.user_id)?.display_name ?? 'Member',
      count: r.completed_count,
      meta: r.assigned_count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const completed8w = weekly.reduce((sum, w) => sum + w.count, 0);
  const open =
    (byStatus.find((s) => s.name === 'To do')?.count ?? 0) +
    (byStatus.find((s) => s.name === 'In progress')?.count ?? 0);
  const doneTotal = byStatus.find((s) => s.name === 'Done')?.count ?? 0;
  const overdue = overdueRow?.overdue_count ?? 0;

  const thisWeek = weekly[weekly.length - 1]?.count ?? 0;
  const prevWeek = weekly[weekly.length - 2]?.count ?? 0;
  const delta = thisWeek - prevWeek;

  // Cycle time: last four weeks against the four before them.
  const cycleSeries = weekly.map((w) => w.cycle);
  const cycleNow = avg(cycleSeries.slice(4));
  const cyclePrev = avg(cycleSeries.slice(0, 4));
  const cycleDelta = cycleNow !== null && cyclePrev !== null ? cycleNow - cyclePrev : null;

  // Completion rate — archived work is neither done nor outstanding.
  const live = open + doneTotal;
  const donePct = live > 0 ? Math.round((doneTotal / live) * 100) : 0;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Analytics</h1>
        <span className="page-meta">last 8 weeks</span>
      </div>

      {/* Stat cards — identity statgrid */}
      <div className="statgrid">
        <div className="stat">
          <span className="s-label">Completed · 8 wks</span>
          <div className="s-num">{completed8w}</div>
          <div className={`s-delta ${delta >= 0 ? 'good' : 'bad'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs last week
          </div>
          <Sparkline values={weekly.map((w) => w.count)} tone="accent" />
        </div>
        <div className="stat">
          <span className="s-label">Median cycle time</span>
          <div className="s-num">{cycleNow !== null ? `${cycleNow.toFixed(1)} d` : 'n/a'}</div>
          {cycleDelta !== null && Math.abs(cycleDelta) >= 0.05 ? (
            <div className={`s-delta ${cycleDelta <= 0 ? 'good' : 'bad'}`}>
              {cycleDelta <= 0 ? '▼' : '▲'} {Math.abs(cycleDelta).toFixed(1)} d vs the four weeks before
            </div>
          ) : (
            <div className="s-delta">start to done, last 4 weeks</div>
          )}
          <Sparkline values={cycleSeries} tone="neutral" />
        </div>
        <div className="stat">
          <span className="s-label">Overdue</span>
          <div className="s-num" style={overdue > 0 ? { color: 'var(--color-accent-2)' } : undefined}>
            {overdue}
          </div>
          {overdue > 0 ? (
            <div className="s-delta bad">
              <span className="dot dot-warn" aria-hidden="true" />
              past due date, needs attention
            </div>
          ) : (
            <div className="s-delta good">nothing past due</div>
          )}
        </div>
        <div className="stat">
          <span className="s-label">On track</span>
          <div className="s-ring">
            <Donut pct={donePct} />
            <div className="s-num">{donePct}%</div>
          </div>
          <div className="s-delta">
            {doneTotal} done · {open} still open
          </div>
        </div>
      </div>

      <AnalyticsCharts weekly={weekly} byStatus={byStatus} perMember={perMember} />
    </>
  );
}
