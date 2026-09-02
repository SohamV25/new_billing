"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TonalCard } from "@/components/tonal-card";

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  subTone?: "default" | "success" | "error" | "accent" | "warning";
  icon?: LucideIcon;
};

const subToneClasses = {
  default: "text-on-surface-variant",
  success: "text-success",
  error: "text-error",
  accent: "text-primary",
  warning: "text-warning",
};

export function KpiCard({
  label,
  value,
  sub,
  subTone = "default",
  icon: Icon,
}: KpiCardProps) {
  return (
    <TonalCard
      padding="md"
      className="hover:border-primary/30 hover:bg-surface-container-high"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {Icon && (
          <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-12">
            <Icon className="text-primary size-4.5 sm:size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-on-surface-variant text-[11px] font-medium tracking-wide uppercase sm:text-xs">
            {label}
          </p>
          <p className="text-on-surface mt-1.5 truncate text-xl font-bold tabular-nums sm:mt-2 sm:text-3xl">
            {value}
          </p>
          {sub && (
            <p
              className={cn(
                "mt-1.5 truncate text-xs font-medium",
                subToneClasses[subTone]
              )}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
    </TonalCard>
  );
}
