/**
 * The two ornaments a stat card can carry, as plain SVG.
 *
 * Deliberately not Recharts: eight points with no axis, no tooltip and no
 * interaction don't justify a client bundle, and these render inside server
 * components.
 */

/** Sparkline — gaps are dropped, not zeroed, so a quiet week isn't a plunge. */
export function Sparkline({
  values,
  tone,
}: {
  values: (number | null)[];
  tone: 'accent' | 'neutral';
}) {
  const present = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null);
  if (present.length < 2) return null;

  const nums = present.map((p) => p.v);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const stepX = values.length > 1 ? 160 / (values.length - 1) : 160;

  const points = present
    .map((p) => `${(p.i * stepX).toFixed(1)},${(24 - ((p.v - min) / span) * 20).toFixed(1)}`)
    .join(' ');

  return (
    <svg className="spark" viewBox="0 0 160 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={tone === 'accent' ? 'var(--color-accent)' : 'var(--color-neutral-400)'}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Completion ring — drawn from the top, 44px. */
export function Donut({ pct }: { pct: number }) {
  const c = 2 * Math.PI * 18;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-neutral-200)" strokeWidth="5" />
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="5"
        strokeDasharray={`${((c * pct) / 100).toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 22 22)"
      />
    </svg>
  );
}
