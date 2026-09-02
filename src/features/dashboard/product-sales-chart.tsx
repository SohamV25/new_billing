"use client";

import { TonalCard } from "@/components/tonal-card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductSalesData, SalesGranularity } from "./types";
import { compactMoney, niceMax, SERIES_COLORS, ticks } from "./chart-utils";

type ProductSalesChartProps = {
  data: ProductSalesData;
  granularity: SalesGranularity;
  onGranularityChange: (value: SalesGranularity) => void;
  title?: string;
};

const RANGES: { value: SalesGranularity; label: string }[] = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
  { value: "year", label: "Yearly" },
];

const W = 340;
const H = 210;
const PAD = { top: 10, right: 8, bottom: 30, left: 44 };

/** How many periods still read clearly at phone width, per product count. */
function maxPeriods(productCount: number): number {
  if (productCount >= 3) return 5;
  if (productCount === 2) return 7;
  return 9;
}

/**
 * Revenue per product, grouped by period — one bar per product in each bucket,
 * so you can see which product carried a given week or quarter.
 */
export function ProductSalesChart({
  data,
  granularity,
  onGranularityChange,
  title = "Sales by product",
}: ProductSalesChartProps) {
  const { products } = data;
  // Keep the most recent buckets so the bars stay wide enough to read.
  const periods = data.periods.slice(-maxPeriods(products.length));

  const allValues = periods.flatMap((p) =>
    p.values.map((v) => Number(v.revenue) || 0)
  );
  const max = niceMax(Math.max(...allValues, 1));

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + innerH;
  const groupW = periods.length > 0 ? innerW / periods.length : innerW;
  const barW = Math.max(
    3,
    Math.min(16, (groupW - 8) / Math.max(products.length, 1))
  );
  const height = (v: number) => (v / max) * innerH;

  const hasData = periods.length > 0 && allValues.some((v) => v > 0);

  return (
    <TonalCard padding="none" className="overflow-hidden">
      <div className="border-outline-variant flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
        <div
          className="border-outline-variant bg-surface-container-high flex rounded-lg border p-0.5"
          role="group"
          aria-label="Period"
        >
          {RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => onGranularityChange(range.value)}
              aria-pressed={granularity === range.value}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                granularity === range.value
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="text-on-surface-variant px-4 py-12 text-center text-sm">
          No sales in this period yet.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-3 sm:px-5">
            {products.map((product, i) => (
              <div key={product.id} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
                  }}
                />
                <span className="text-on-surface-variant text-xs">
                  {product.name}
                </span>
              </div>
            ))}
          </div>

          <div className="px-2 pb-3 sm:px-3">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`${title} by ${granularity}: ${periods
                .map(
                  (p) =>
                    `${p.period} — ${p.values
                      .map((v, i) => `${products[i]?.name} ${formatMoney(v.revenue)}`)
                      .join(", ")}`
                )
                .join("; ")}`}
            >
              {ticks(max).map((t) => (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={baseline - height(t)}
                    y2={baseline - height(t)}
                    stroke="var(--outline-variant)"
                    strokeWidth="1"
                  />
                  <text
                    x={PAD.left - 6}
                    y={baseline - height(t) + 3}
                    textAnchor="end"
                    fontSize="8"
                    fill="var(--on-surface-variant)"
                  >
                    {compactMoney(t)}
                  </text>
                </g>
              ))}

              {periods.map((period, pi) => {
                const centre = PAD.left + pi * groupW + groupW / 2;
                const totalW = barW * products.length + 2 * (products.length - 1);
                const startX = centre - totalW / 2;
                return (
                  <g key={period.periodKey}>
                    {period.values.map((value, vi) => {
                      const v = Number(value.revenue) || 0;
                      const h = height(v);
                      return (
                        <rect
                          key={value.productId}
                          x={startX + vi * (barW + 2)}
                          y={baseline - h}
                          width={barW}
                          height={Math.max(h, v > 0 ? 1 : 0)}
                          rx="2"
                          fill={SERIES_COLORS[vi % SERIES_COLORS.length]}
                        >
                          <title>{`${period.period} — ${products[vi]?.name}: ${formatMoney(value.revenue)} (${value.qty} sold)`}</title>
                        </rect>
                      );
                    })}
                    <text
                      x={centre}
                      y={H - 10}
                      textAnchor="middle"
                      fontSize="8"
                      fill="var(--on-surface-variant)"
                    >
                      {period.period}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </>
      )}
    </TonalCard>
  );
}
