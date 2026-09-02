"use client";

import { formatMoney } from "@/lib/format";
import type { RevenueTrendRow } from "@/lib/reports/columns";

type SeriesConfig = {
  key: "invoiced" | "collected" | "gst" | "outstanding";
  label: string;
  color: string;
  strokeWidth?: number;
  fillOpacity?: number;
};

type TrendChartProps = {
  data: RevenueTrendRow[];
  series: SeriesConfig[];
  height?: number;
  title?: string;
};

function getMaxValue(data: RevenueTrendRow[], series: SeriesConfig[]): number {
  let max = 0;
  for (const row of data) {
    for (const s of series) {
      const val = Number(row[s.key]);
      if (val > max) max = val;
    }
  }
  return max;
}

function formatYAxis(value: number): string {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

export function TrendChart({
  data,
  series,
  height = 280,
  title,
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="border-outline-variant bg-surface-container rounded-2xl border p-6"
        role="img"
        aria-label={`${title || "Trend chart"} - No data available`}
      >
        <div className="text-on-surface-variant flex h-[280px] items-center justify-center text-sm">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = getMaxValue(data, series);
  const padding = { top: 20, right: 60, bottom: 40, left: 70 };
  const innerWidth = 800 - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const stepX = innerWidth / Math.max(1, data.length - 1);
  const yScale = innerHeight / (maxValue || 1);

  const pointsBySeries = series.map((s) =>
    data.map((row, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + innerHeight - Number(row[s.key]) * yScale,
      value: Number(row[s.key]),
      period: row.period,
    }))
  );

  const yTicks = 5;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = (maxValue / yTicks) * (yTicks - i);
    const y = padding.top + (innerHeight / yTicks) * i;
    return { y, value, label: formatYAxis(value) };
  });

  const ariaLabel = `${title || "Trend chart"}: ${series.map((s) => `${s.label} from ${formatMoney(data[0]?.[s.key] || "0")} to ${formatMoney(data[data.length - 1]?.[s.key] || "0")}`).join(", ")}`;

  return (
    <div className="border-outline-variant bg-surface-container overflow-hidden rounded-2xl border">
      {title && (
        <div className="border-outline-variant border-b px-4 py-3 sm:px-5">
          <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
        </div>
      )}
      <div className="min-w-[640px] overflow-x-auto p-4 sm:p-5">
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            viewBox={`0 0 800 ${height}`}
            preserveAspectRatio="none"
            className="h-full w-full"
            role="img"
            aria-label={ariaLabel}
          >
            {gridLines.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={800 - padding.right}
                  y2={tick.y}
                  stroke="var(--outline-variant)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 12}
                  y={tick.y + 4}
                  textAnchor="end"
                  fill="var(--on-surface-variant)"
                  fontSize="11"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            <line
              x1={padding.left}
              y1={padding.top + innerHeight}
              x2={800 - padding.right}
              y2={padding.top + innerHeight}
              stroke="var(--outline-variant)"
              strokeWidth="1"
            />

            {series.map((s, si) => {
              const points = pointsBySeries[si];
              if (points.length < 2) return null;

              const pathData = points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ");

              const areaData =
                points
                  .map((p, i) =>
                    i === 0
                      ? `M ${p.x} ${padding.top + innerHeight} L ${p.x} ${p.y}`
                      : `L ${p.x} ${p.y}`
                  )
                  .join(" ") +
                ` L ${points[points.length - 1].x} ${padding.top + innerHeight} Z`;

              return (
                <g key={s.key}>
                  {s.fillOpacity && s.fillOpacity > 0 && (
                    <path
                      d={areaData}
                      fill={s.color}
                      fillOpacity={s.fillOpacity}
                    />
                  )}
                  <path
                    d={pathData}
                    stroke={s.color}
                    strokeWidth={s.strokeWidth ?? 2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p) => (
                    <circle
                      key={`${p.x}-${p.y}`}
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill={s.color}
                      stroke="var(--surface-container)"
                      strokeWidth={2}
                    />
                  ))}
                </g>
              );
            })}

            {data.map((row, i) => {
              const x = padding.left + i * stepX;
              const isLast = i === data.length - 1;
              const showLabel =
                data.length <= 12 ||
                i % Math.ceil(data.length / 10) === 0 ||
                isLast;
              if (!showLabel) return null;
              return (
                <text
                  key={i}
                  x={x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  fill="var(--on-surface-variant)"
                  fontSize="11"
                  transform={`rotate(-45 ${x} ${padding.top + innerHeight + 20})`}
                >
                  {row.period}
                </text>
              );
            })}
          </svg>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-on-surface-variant text-xs">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
