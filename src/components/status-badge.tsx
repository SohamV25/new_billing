import { cn } from "@/lib/utils";

type StatusVariant =
  | "paid"
  | "pending"
  | "overdue"
  | "draft"
  | "cancelled"
  | "expired"
  | "converted"
  | "sent"
  | "accepted"
  | "rejected"
  | "completed"
  | "refunded"
  | "partially_paid"
  | "out-of-stock"
  | "low-stock"
  | "in-stock"
  | "in"
  | "out"
  | "adjustment"
  | "delivered"
  | "processing"
  | "canceled"
  | "failed";

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

const statusStyles: Record<StatusVariant, string> = {
  paid: "text-success",
  delivered: "text-success",
  completed: "text-success",
  accepted: "text-success",
  "in-stock": "text-success",
  in: "text-success",
  pending: "text-warning",
  processing: "text-primary",
  partially_paid: "text-warning",
  sent: "text-warning",
  "low-stock": "text-warning",
  overdue: "text-error",
  cancelled: "text-error",
  canceled: "text-error",
  rejected: "text-error",
  "out-of-stock": "text-error",
  out: "text-error",
  failed: "text-error",
  refunded: "text-violet",
  expired: "text-on-surface-variant",
  converted: "text-violet",
  draft: "text-on-surface-variant",
  adjustment: "text-primary",
};

const dotColors: Record<StatusVariant, string> = {
  paid: "bg-success",
  delivered: "bg-success",
  completed: "bg-success",
  accepted: "bg-success",
  "in-stock": "bg-success",
  in: "bg-success",
  pending: "bg-warning",
  processing: "bg-primary",
  partially_paid: "bg-warning",
  sent: "bg-warning",
  "low-stock": "bg-warning",
  overdue: "bg-error",
  cancelled: "bg-error",
  canceled: "bg-error",
  rejected: "bg-error",
  "out-of-stock": "bg-error",
  out: "bg-error",
  failed: "bg-error",
  refunded: "bg-violet",
  expired: "bg-on-surface-variant",
  converted: "bg-violet",
  draft: "bg-on-surface-variant",
  adjustment: "bg-primary",
};

const defaultLabels: Record<StatusVariant, string> = {
  paid: "Paid",
  delivered: "Delivered",
  completed: "Completed",
  accepted: "Accepted",
  "in-stock": "In Stock",
  in: "IN",
  pending: "Pending",
  processing: "Processing",
  partially_paid: "Partial",
  sent: "Sent",
  "low-stock": "Low Stock",
  overdue: "Overdue",
  cancelled: "Canceled",
  canceled: "Canceled",
  rejected: "Rejected",
  "out-of-stock": "Out of Stock",
  out: "OUT",
  failed: "Failed",
  refunded: "Refunded",
  expired: "Expired",
  converted: "Converted",
  draft: "Draft",
  adjustment: "Adjust",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium",
        statusStyles[status],
        className
      )}
    >
      <span className={cn("size-2 rounded-full", dotColors[status])} />
      {label ?? defaultLabels[status]}
    </span>
  );
}
