"use client";

import { formatNumber } from "@/lib/format";
import { StockStatusBadge } from "@/components/stock-status";
import type { InventoryListItem } from "@/lib/services/inventory";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TonalCard } from "@/components/tonal-card";

type LowStockPanelProps = {
  items: InventoryListItem[];
  title?: string;
};

export function LowStockPanel({
  items,
  title = "Low Stock Overview",
}: LowStockPanelProps) {
  return (
    <TonalCard padding="none" className="overflow-hidden">
      <div className="border-outline-variant flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
        <Link
          href="/inventory"
          className="text-primary hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <div className="divide-outline-variant divide-y">
        {items.length === 0 ? (
          <div className="text-on-surface-variant p-6 text-center text-sm">
            No low stock items
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="hover:bg-surface-container-high flex items-center gap-3 px-4 py-3 transition-colors sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-on-surface truncate text-sm">
                    {item.name}
                  </span>
                  <StockStatusBadge
                    quantity={item.quantity}
                    lowStockAt={item.lowStockAt}
                    unit={item.unit}
                  />
                </div>
                <div className="text-on-surface-variant mt-0.5 text-xs tabular-nums">
                  {item.sku ? `SKU: ${item.sku}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3 text-right whitespace-nowrap">
                <div className="bg-outline-variant h-1.5 w-16 flex-1 overflow-hidden rounded-full sm:w-24">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        item.lowStockAt > 0
                          ? Math.min(
                              100,
                              (item.quantity / item.lowStockAt) * 100
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-on-surface text-sm font-medium tabular-nums">
                  {formatNumber(item.quantity)}
                </span>
                <span className="text-on-surface-variant text-xs tabular-nums">
                  / {formatNumber(item.lowStockAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </TonalCard>
  );
}
