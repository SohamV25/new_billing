import {
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  REPORT_DESCRIPTIONS,
  REPORT_TITLES,
} from "@/lib/reports/columns";
import type { ReportType } from "@/lib/validations/report";

export { REPORT_DESCRIPTIONS, REPORT_TITLES };

export const REPORT_ORDER: ReportType[] = [
  "sales",
  "payments",
  "tax",
  "customers",
  "products",
  "inventory",
  "outstanding",
  "top-products",
  "top-customers",
  "revenue-trends",
];

export type ReportFilterConfig = {
  search?: boolean;
  dateRange?: boolean;
  customer?: boolean;
  status?: boolean;
  method?: boolean;
  topN?: boolean;
  granularity?: boolean;
  overdueOnly?: boolean;
};

export const REPORT_FILTERS: Record<ReportType, ReportFilterConfig> = {
  sales: { search: true, dateRange: true, customer: true, status: true },
  payments: {
    search: true,
    dateRange: true,
    customer: true,
    method: true,
    status: true,
  },
  tax: { dateRange: true, customer: true },
  customers: { search: true, dateRange: true },
  products: { search: true, dateRange: true },
  inventory: { dateRange: true, status: true },
  outstanding: { search: true, customer: true, overdueOnly: true },
  "top-products": { dateRange: true, topN: true },
  "top-customers": { dateRange: true, topN: true },
  "revenue-trends": { dateRange: true, granularity: true },
};

export const SALES_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: INVOICE_STATUS_LABELS.PENDING },
  { value: "PARTIALLY_PAID", label: INVOICE_STATUS_LABELS.PARTIALLY_PAID },
  { value: "PAID", label: INVOICE_STATUS_LABELS.PAID },
  { value: "OVERDUE", label: INVOICE_STATUS_LABELS.OVERDUE },
];

export const PAYMENT_STATUS_OPTIONS: { value: string; label: string }[] =
  Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

export const PAYMENT_METHOD_OPTIONS: { value: string; label: string }[] =
  Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

export const INVENTORY_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

export const TOP_N_OPTIONS = [5, 10, 25, 50];

export const GRANULARITY_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];
