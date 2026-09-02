import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/features/invoices/types";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant border-transparent",
  PENDING: "bg-secondary/15 text-secondary border-transparent",
  PARTIALLY_PAID: "bg-tertiary/15 text-tertiary border-transparent",
  PAID: "bg-primary-container/15 text-primary-container border-transparent",
  OVERDUE: "bg-error/10 text-error border-transparent",
  CANCELLED: "bg-muted text-muted-foreground border-transparent",
  VOID: "bg-muted text-muted-foreground border-transparent",
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  VOID: "Void",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
