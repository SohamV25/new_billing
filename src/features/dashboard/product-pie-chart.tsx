"use client";

import { TonalCard } from "@/components/tonal-card";
import { formatMoney, formatNumber } from "@/lib/format";
import type { ProductSalesData } from "./types";
import { arcPath, SERIES_COLORS } from "./chart-utils";

type ProductPieChartProps = {
  data: ProductSalesData;
  title?: string;
};

const SIZE = 160;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER = 70;
const INNER = 44;

/**
 * Revenue share by product. With a small catalogue this answers "what is
 * actually selling?" at a glance, which a table of numbers does not.
 */
export function ProductPieChart({
  data,
  title = "Revenue by product",
}: ProductPieChartProps) {
  // Shares the product ordering with the bars chart so a product keeps the
  // same colour across the dashboard.
  const items = data.products
    .map((product, index) => ({
      ...product,
      color: SERIES_COLORS[index % SERIES_COLORS.length],
    }))
    .filter((product) => Number(product.revenue) > 0);
  const total = items.reduce((sum, row) => sum + Number(row.revenue), 0);

  if (items.length === 0 || total === 0) {
    return (
      <TonalCard padding="none" className="overflow-hidden">
        <Header title={title} />
        <p className="text-on-surface-variant px-4 py-12 text-center text-sm">
          No sales recorded yet.
        </p>
      </TonalCard>
    );
  }

  // Running offsets computed up front — mutating a closure during map upsets
  // the React compiler.
  const shares = items.map((row) => Number(row.revenue) / total);
  const offsets = shares.reduce<number[]>(
    (acc, share, i) => [...acc, (acc[i] ?? 0) + share],
    [0]
  );

  const slices = items.map((row, i) => ({
    row,
    value: Number(row.revenue),
    share: shares[i],
    path: arcPath(CX, CY, OUTER, INNER, offsets[i] * 360, offsets[i + 1] * 360),
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return (
    <TonalCard padding="none" className="overflow-hidden">
      <Header title={title} />

      <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:gap-6 sm:p-5">
        <div className="relative shrink-0">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-40 w-40"
            role="img"
            aria-label={`${title}: ${slices
              .map((s) => `${s.row.name} ${Math.round(s.share * 100)} percent`)
              .join(", ")}`}
          >
            {slices.map((s) => (
              <path
                key={s.row.id}
                d={s.path}
                fill={s.color}
                stroke="var(--surface-container)"
                strokeWidth="1.5"
              >
                <title>{`${s.row.name}: ${formatMoney(s.row.revenue)}`}</title>
              </path>
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-on-surface-variant text-[10px] tracking-wide uppercase">
              Total
            </span>
            <span className="text-on-surface text-sm font-semibold tabular-nums">
              {formatMoney(String(total))}
            </span>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-2.5">
          {slices.map((s) => (
            <li key={s.row.id} className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-on-surface truncate text-sm">{s.row.name}</p>
                <p className="text-on-surface-variant text-xs tabular-nums">
                  {formatNumber(s.row.qty)} sold
                </p>
              </div>
              <div className="text-right">
                <p className="text-on-surface text-sm font-medium tabular-nums">
                  {Math.round(s.share * 100)}%
                </p>
                <p className="text-on-surface-variant text-xs tabular-nums">
                  {formatMoney(s.row.revenue)}
                </p>
              </div>
            </li>
          ))}
        </ul>
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
