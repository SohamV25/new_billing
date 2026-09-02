"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TonalCard } from "@/components/tonal-card";

type ActivityItem = {
  id: string;
  primary: string;
  secondary: string;
  trailing?: React.ReactNode;
};

type ActivityPanelProps = {
  title: string;
  icon: LucideIcon;
  href: string;
  items: ActivityItem[];
};

export function ActivityPanel({
  title,
  icon: Icon,
  href,
  items,
}: ActivityPanelProps) {
  return (
    <TonalCard padding="none" className="overflow-hidden">
      <div className="border-outline-variant flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
            <Icon className="text-primary size-4" />
          </div>
          <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
        </div>
        <Link
          href={href}
          className="text-primary hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <div className="divide-outline-variant divide-y">
        {items.length === 0 ? (
          <div className="text-on-surface-variant p-6 text-center text-sm">
            No recent activity
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="hover:bg-surface-container-high flex items-center justify-between gap-3 px-4 py-3 transition-colors sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-on-surface truncate text-sm">
                  {item.primary}
                </p>
                <p className="text-on-surface-variant mt-0.5 truncate text-xs tracking-wider uppercase">
                  {item.secondary}
                </p>
              </div>
              {item.trailing && (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {item.trailing}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </TonalCard>
  );
}
