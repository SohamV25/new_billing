/**
 * Shared helpers for the dashboard charts.
 *
 * Every chart draws into a fixed viewBox and is rendered with `w-full h-auto`,
 * so it scales down to phone width instead of scrolling sideways.
 */

/** Compact Indian-format money for axis ticks: ₹1.2L, ₹3.4Cr. */
export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

/** A "nice" axis maximum so gridlines land on round numbers. */
export function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step =
    normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Evenly spaced tick values from 0 to max, inclusive. */
export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/**
 * Keeps at most `max` labels on the x-axis so they never collide on a phone.
 * Always keeps the first and last.
 */
export function thinLabels<T>(items: T[], max: number): (T | null)[] {
  if (items.length <= max) return items;
  const step = Math.ceil(items.length / max);
  return items.map((item, i) =>
    i === 0 || i === items.length - 1 || i % step === 0 ? item : null
  );
}

/** Series colours, in the order charts should use them. */
export const SERIES_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--violet)",
  "var(--warning)",
  "var(--secondary)",
] as const;

/** Cartesian point for a pie/donut slice edge at `angle` degrees. */
export function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG path for a donut segment between two angles. */
export function arcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number
): string {
  // A full circle cannot be expressed as a single arc; nudge it just short.
  const sweep = end - start >= 360 ? 359.99 : end - start;
  const finish = start + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const o1 = polar(cx, cy, outer, start);
  const o2 = polar(cx, cy, outer, finish);
  const i1 = polar(cx, cy, inner, finish);
  const i2 = polar(cx, cy, inner, start);

  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}
