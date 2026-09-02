import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "./types";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  COMPLETED:
    "bg-primary-container/15 text-primary-container border-transparent",
  REFUNDED: "bg-muted text-muted-foreground border-transparent",
  FAILED: "bg-error/10 text-error border-transparent",
  PENDING: "border-border text-on-surface-variant",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: "Completed",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  PENDING: "Pending",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
