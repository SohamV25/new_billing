"use client";

import { formatMoney, formatNumber } from "@/lib/format";
import type {
  TopProductReportRow,
  TopCustomerReportRow,
} from "@/lib/reports/columns";
import { TonalCard } from "@/components/tonal-card";

type TopListProps = {
  items: (TopProductReportRow | TopCustomerReportRow)[];
  title?: string;
  valueKey: "revenue" | "billed";
  labelKey: "name";
  subKey?: "invoiceCount";
};

function getItemValue(
  item: TopProductReportRow | TopCustomerReportRow,
  key: "revenue" | "billed"
): number {
  if (key === "revenue" && "revenue" in item) {
    return Number(item.revenue);
  }
  if (key === "billed" && "billed" in item) {
    return Number(item.billed);
  }
  return 0;
}

function getItemSub(
  item: TopProductReportRow | TopCustomerReportRow,
  subKey?: "invoiceCount"
): string | null {
  if (!subKey) return null;
  if (subKey === "invoiceCount" && "invoiceCount" in item) {
    return formatNumber(item.invoiceCount);
  }
  return null;
}

export function TopList({
  items,
  title,
  valueKey,
  labelKey,
  subKey,
}: TopListProps) {
  if (items.length === 0) {
    return (
      <div
        className="border-outline-variant bg-surface-container rounded-2xl border p-6"
        role="img"
        aria-label={`${title || "Top items"} - No data available`}
      >
        <div className="text-on-surface-variant flex h-[280px] items-center justify-center text-sm">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...items.map((item) => getItemValue(item, valueKey))
  );

  const ariaLabel = `${title || "Top items"}: ${items.map((item) => `${item.rank}. ${item[labelKey]} ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(getItemValue(item, valueKey))}`).join(", ")}`;

  return (
    <TonalCard padding="none" className="overflow-hidden">
      {title && (
        <div className="border-outline-variant border-b px-4 py-3 sm:px-5">
          <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-5">
        <ul className="space-y-3" role="list" aria-label={ariaLabel}>
          {items.map((item) => {
            const value = getItemValue(item, valueKey);
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const sub = getItemSub(item, subKey);

            return (
              <li key={item.id} className="group">
                <div className="flex items-start gap-3">
                  <span className="text-on-surface-variant mt-0.5 w-5 shrink-0 text-right text-xs font-medium tabular-nums">
                    {item.rank}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-on-surface truncate text-sm">
                        {item[labelKey]}
                      </span>
                      <span className="text-on-surface shrink-0 text-sm font-medium tabular-nums">
                        {formatMoney(value.toString())}
                      </span>
                    </div>
                    {sub && (
                      <div className="text-on-surface-variant mt-0.5 truncate text-xs">
                        {sub}
                      </div>
                    )}
                    <div className="bg-outline-variant mt-1.5 h-1 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </TonalCard>
  );
}
