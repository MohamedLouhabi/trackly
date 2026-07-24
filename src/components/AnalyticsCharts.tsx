'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* Identity data-viz atoms — palette tones only, validated with the six-checks
   script: neutral-300 ground series + cyan emphasized figure (CVD ΔE 26+),
   gray's low surface contrast is relieved by direct value labels on every
   bar (non-dismissable obligation from the contrast check). Magenta appears
   as a series in exactly one place — the high-priority slice of the weekly
   bar, which is the "genuinely urgent" reading the identity reserves it for. */
const INK = {
  ground: '#d8d5d3', // neutral-300 — the series
  emphasis: '#0088b0', // process cyan — the emphasized figure
  urgent: '#e05496', // accent-2-400 — the high-priority slice
  fill: '#e0f1f7', // accent-100 — area under the trend line
  point: '#005f7d', // accent-700 — the latest reading
  grid: '#e9e7e6', // neutral-200 — recessive grid
  axis: '#928e8b', // neutral-500 — axis text
  label: '#6f6b68', // neutral-600 — value labels (text token, not series color)
};

export interface WeekPoint {
  week: string;
  count: number;
  /** High/urgent share of `count` — the magenta slice. */
  high: number;
  /** count - high — the ground slice. */
  normal: number;
  /** Median days from created to done, null when nothing finished that week. */
  cycle: number | null;
  current: boolean;
}

export interface NamedCount {
  name: string;
  count: number;
  meta?: number; // assigned total, for the member tooltip
}

const tipStyle: React.CSSProperties = {
  background: 'var(--color-neutral-100)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid var(--color-divider)',
  padding: '8px 12px',
  fontSize: 12,
};

function Empty() {
  return (
    <p style={{ padding: '40px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--color-neutral-400)' }}>
      No data yet.
    </p>
  );
}

function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={tipStyle}>
      <p style={{ fontWeight: 600, margin: 0 }}>{p.payload.name ?? label}</p>
      <p style={{ margin: '2px 0 0', color: 'var(--color-neutral-600)', fontFeatureSettings: '"tnum" 1' }}>
        {p.value} {suffix}
        {typeof p.payload.meta === 'number' && ` · ${p.payload.meta} assigned`}
      </p>
    </div>
  );
}

/** Weekly bar tooltip — the stack reads as one figure, so it states the total first. */
function WeekTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const w = payload[0].payload as WeekPoint;
  return (
    <div style={tipStyle}>
      <p style={{ fontWeight: 600, margin: 0 }}>Week of {label}</p>
      <p style={{ margin: '2px 0 0', color: 'var(--color-neutral-600)', fontFeatureSettings: '"tnum" 1' }}>
        {w.count} finished
        {w.high > 0 && ` · ${w.high} high priority`}
      </p>
    </div>
  );
}

function CycleTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div style={tipStyle}>
      <p style={{ fontWeight: 600, margin: 0 }}>Week of {label}</p>
      <p style={{ margin: '2px 0 0', color: 'var(--color-neutral-600)', fontFeatureSettings: '"tnum" 1' }}>
        {payload[0].value} days median
      </p>
    </div>
  );
}

function HBarChart({ data, suffix }: { data: NamedCount[]; suffix: string }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap="32%">
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={104}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: INK.axis }}
        />
        <Tooltip cursor={{ fill: 'rgba(32,30,29,0.04)' }} content={<ChartTooltip suffix={suffix} />} />
        <Bar dataKey="count" fill={INK.emphasis} radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: INK.label }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Only the most recent reading carries a dot — the rest is line. */
function LastDot({ cx, cy, index, lastIndex }: any) {
  if (index !== lastIndex || cx == null || cy == null) return <g />;
  return <circle cx={cx} cy={cy} r={4} fill={INK.point} />;
}

export function AnalyticsCharts({
  weekly,
  byStatus,
  perMember,
}: {
  weekly: WeekPoint[];
  byStatus: NamedCount[];
  perMember: NamedCount[];
}) {
  const cyclePoints = weekly.filter((w) => w.cycle !== null);
  const lastCycleIndex = weekly.reduce((last, w, i) => (w.cycle !== null ? i : last), -1);
  const anyHigh = weekly.some((w) => w.high > 0);

  return (
    <div className="charts">
      {/* Throughput — ground bars, cyan current week, magenta high-priority slice */}
      <div className="chart">
        <h2>Throughput by week</h2>
        <p className="c-sub">Cards finished, split by priority</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weekly} margin={{ top: 18, right: 0, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={INK.grid} />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: INK.axis }}
            />
            <YAxis hide />
            <Tooltip cursor={{ fill: 'rgba(32,30,29,0.04)' }} content={<WeekTooltip />} />
            <Bar dataKey="normal" stackId="week" maxBarSize={40}>
              {weekly.map((w) => (
                <Cell key={w.week} fill={w.current ? INK.emphasis : INK.ground} />
              ))}
            </Bar>
            <Bar
              dataKey="high"
              stackId="week"
              fill={INK.urgent}
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
            >
              <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: INK.label }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="legend">
          <span>
            <i style={{ background: INK.ground }} />
            Finished
          </span>
          {anyHigh && (
            <span>
              <i style={{ background: INK.urgent }} />
              High priority
            </span>
          )}
          <span>
            <i style={{ background: INK.emphasis }} />
            This week
          </span>
        </div>
      </div>

      {/* Cycle time — the one trend line on the page */}
      <div className="chart">
        <h2>Cycle time trend</h2>
        <p className="c-sub">Median days from start to done</p>
        {cyclePoints.length < 2 ? (
          <Empty />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekly} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: INK.axis }}
                />
                <YAxis
                  width={38}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: INK.axis }}
                  tickFormatter={(v) => `${v} d`}
                />
                <Tooltip cursor={{ stroke: INK.grid }} content={<CycleTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cycle"
                  connectNulls
                  stroke={INK.emphasis}
                  strokeWidth={2}
                  fill={INK.fill}
                  dot={<LastDot lastIndex={lastCycleIndex} />}
                  activeDot={{ r: 4, fill: INK.point, stroke: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="legend">
              <span>
                <i style={{ background: INK.emphasis }} />
                Median cycle time
              </span>
            </div>
          </>
        )}
      </div>

      {/* Per-member completion — names need the wide column */}
      <div className="chart">
        <h2>Completed per member</h2>
        <p className="c-sub">Assigned tasks finished, all time</p>
        <HBarChart data={perMember} suffix="completed" />
      </div>

      {/* Tasks by status — single cyan series, rows carry identity */}
      <div className="chart">
        <h2>Tasks by status</h2>
        <p className="c-sub">Everything on the board today</p>
        <HBarChart data={byStatus} suffix="tasks" />
      </div>
    </div>
  );
}
