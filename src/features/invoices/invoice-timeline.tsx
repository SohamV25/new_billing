"use client";

import {
  CheckCircle2,
  FileText,
  HandCoins,
  Pencil,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useInvoiceTimeline } from "@/features/invoices/hooks";
import type { TimelineEntry } from "@/features/invoices/types";

type TimelineStyle = {
  icon: LucideIcon;
  label: string;
  iconClass: string;
};

const TIMELINE_STYLES: Record<string, TimelineStyle> = {
  INVOICE_CREATED: {
    icon: FileText,
    label: "Invoice created",
    iconClass: "bg-primary/10 text-primary",
  },
  INVOICE_UPDATED: {
    icon: Pencil,
    label: "Invoice updated",
    iconClass: "bg-surface-container-high text-on-surface-variant",
  },
  INVOICE_DELETED: {
    icon: Trash2,
    label: "Invoice deleted",
    iconClass: "bg-error/10 text-error",
  },
  INVOICE_FINALIZED: {
    icon: CheckCircle2,
    label: "Invoice issued",
    iconClass: "bg-tertiary/10 text-tertiary",
  },
  INVOICE_PAYMENT_RECEIVED: {
    icon: HandCoins,
    label: "Payment received",
    iconClass: "bg-primary/10 text-primary",
  },
  INVOICE_CANCELLED: {
    icon: XCircle,
    label: "Invoice cancelled",
    iconClass: "bg-error/10 text-error",
  },
};

function entryLabel(entry: TimelineEntry): string {
  const style = TIMELINE_STYLES[entry.action];
  if (style) {
    if (
      entry.action === "INVOICE_PAYMENT_RECEIVED" &&
      entry.metadata &&
      (typeof entry.metadata.amount === "number" ||
        typeof entry.metadata.amount === "string")
    ) {
      return `${style.label} · ${formatMoney(entry.metadata.amount)}`;
    }
    return style.label;
  }
  return entry.action;
}

function entryActor(entry: TimelineEntry): string | null {
  if (entry.metadata && typeof entry.metadata.user === "string") {
    return entry.metadata.user;
  }
  return entry.user?.name ?? null;
}

function TimelineSkeletons() {
  return (
    <div className="space-y-4 px-6 py-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InvoiceTimeline({ invoiceId }: { invoiceId: string }) {
  const timelineQuery = useInvoiceTimeline(invoiceId);
  const entries = timelineQuery.data ?? [];

  return (
    <section className="border-border bg-surface-card overflow-hidden rounded-xl border">
      <div className="border-b px-6 py-4">
        <h3 className="text-headline-sm text-on-surface font-medium">
          Activity
        </h3>
        <p className="text-body-md text-on-surface-variant mt-0.5">
          Timeline of changes and events for this invoice.
        </p>
      </div>

      {timelineQuery.isPending ? (
        <TimelineSkeletons />
      ) : entries.length === 0 ? (
        <p className="text-body-md text-on-surface-variant px-6 py-6">
          No activity yet.
        </p>
      ) : (
        <ol className="divide-border divide-y">
          {entries.map((entry) => {
            const style = TIMELINE_STYLES[entry.action];
            const Icon = style?.icon ?? FileText;
            const label = entryLabel(entry);
            const actor = entryActor(entry);
            return (
              <li key={entry.id} className="flex items-start gap-3 px-6 py-4">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    style?.iconClass ??
                    "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-body-md text-on-surface font-medium">
                    {label}
                  </p>
                  <p className="font-geist text-mono-sm text-on-surface-variant mt-0.5">
                    {formatDateTime(entry.createdAt)}
                    {actor ? ` · ${actor}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
