"use client";

import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  const card = cn(
    "animate-pulse bg-surface-container-high rounded-xl border border-border"
  );

  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className={cn(card, "h-8 w-48")} />
          <div className={cn(card, "mt-2 h-5 w-64")} />
        </div>
        <div className={cn(card, "h-10 w-24")} />
      </div>

      {/* Quick actions skeleton */}
      <div className={cn(card, "h-12")} />

      {/* KPI grid skeleton - 11 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <div
            key={i}
            className={cn(card, "h-28", i === 1 && "sm:col-span-2")}
          />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Revenue Trend - full width on lg */}
        <div className={cn(card, "h-[340px] lg:col-span-2")} />
        {/* Invoice Status */}
        <div className={cn(card, "h-[340px]")} />
        {/* Sales by Month */}
        <div className={cn(card, "h-[340px] xl:col-span-2")} />
        {/* Payment Status */}
        <div className={cn(card, "h-[340px]")} />
        {/* Top Products */}
        <div className={cn(card, "h-[340px]")} />
        {/* Top Customers */}
        <div className={cn(card, "h-[340px]")} />
        <div className={cn(card, "h-[340px]")} />
        {/* Low Stock */}
        <div className={cn(card, "h-[340px]")} />
      </div>

      {/* Activity panels skeleton */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn(card, "h-[300px]")} />
        ))}
      </div>
    </div>
  );
}
