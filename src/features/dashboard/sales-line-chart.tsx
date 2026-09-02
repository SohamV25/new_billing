"use client";

import { useId } from "react";
import { TonalCard } from "@/components/tonal-card";
import { formatMoney } from "@/lib/format";
import type { RevenueTrendRow } from "@/lib/reports/columns";
import { compactMoney, niceMax, thinLabels, ticks } from "./chart-utils";

type SalesLineChartProps = {
  data: RevenueTrendRow[];
  title?: string;
};

const W = 340;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 44 };

/**
 * Revenue over time: invoiced against collected. The gap between the two lines
 * is the point — it is money billed but not yet in the bank.
 */
export function SalesLineChart({
  data,
  title = "Revenue trend",
}: SalesLineChartProps) {
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <TonalCard padding="none" className="overflow-hidden">
        <Header title={title} />
        <p className="text-on-surface-variant px-4 py-12 text-center text-sm">
          No revenue in this period yet.
        </p>
      </TonalCard>
    );
  }

  const invoiced = data.map((d) => Number(d.invoiced) || 0);
  const collected = data.map((d) => Number(d.collected) || 0);
  const max = niceMax(Math.max(...invoiced, ...collected, 1));

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const x = (i: number) =>
    PAD.left + (data.length === 1 ? innerW / 2 : i * stepX);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const area = `${line(invoiced)} L ${x(invoiced.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;

  const totalInvoiced = invoiced.reduce((a, b) => a + b, 0);
  const totalCollected = collected.reduce((a, b) => a + b, 0);
  const labels = thinLabels(data, 5);

  return (
    <TonalCard padding="none" className="overflow-hidden">
      <Header title={title} />

      <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 pt-3 sm:px-5">
        <Metric label="Invoiced" value={totalInvoiced} tone="primary" />
        <Metric label="Collected" value={totalCollected} tone="success" />
      </div>

      <div className="px-2 pb-3 sm:px-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${title}: ${formatMoney(String(totalInvoiced))} invoiced, ${formatMoney(String(totalCollected))} collected`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks(max).map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--outline-variant)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 3}
                textAnchor="end"
                fontSize="8"
                fill="var(--on-surface-variant)"
              >
                {compactMoney(t)}
              </text>
            </g>
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line(invoiced)}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={line(collected)}
            fill="none"
            stroke="var(--success)"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {invoiced.map((v, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(v)}
              r="2.5"
              fill="var(--surface-container)"
              stroke="var(--primary)"
              strokeWidth="1.5"
            >
              <title>{`${data[i].period}: ${formatMoney(data[i].invoiced)} invoiced`}</title>
            </circle>
          ))}

          {labels.map((row, i) =>
            row ? (
              <text
                key={row.periodKey}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="8"
                fill="var(--on-surface-variant)"
              >
                {row.period}
              </text>
            ) : null
          )}
        </svg>
      </div>
    </TonalCard>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="border-outline-variant border-b px-4 py-3 sm:px-5">
      <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "success";
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span
          className={`size-2 rounded-full ${tone === "primary" ? "bg-primary" : "bg-success"}`}
        />
        <span className="text-on-surface-variant text-xs">{label}</span>
      </div>
      <p className="text-on-surface text-base font-semibold tabular-nums">
        {formatMoney(String(value))}
      </p>
    </div>
  );
}
