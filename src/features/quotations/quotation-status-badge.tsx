import { Badge } from "@/components/ui/badge";
import type { QuotationStatus } from "@/features/quotations/types";

const STATUS_STYLES: Record<QuotationStatus, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant border-transparent",
  SENT: "bg-secondary/15 text-secondary border-transparent",
  ACCEPTED: "bg-tertiary/15 text-tertiary border-transparent",
  REJECTED: "bg-error/10 text-error border-transparent",
  EXPIRED: "bg-muted text-muted-foreground border-transparent",
  CONVERTED:
    "bg-primary-container/15 text-primary-container border-transparent",
};

const STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CONVERTED: "Converted",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
