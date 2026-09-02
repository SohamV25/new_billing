import type { ReportType } from "@/lib/validations/report";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

// ---------------------------------------------------------------------------
// Report row DTOs
//
// These are the shapes produced by `src/lib/services/reports.ts` and consumed
// by the reports table, CSV export, and the print document. They live here
// (pure types, framework-free) so the server mappers and the client share a
// single definition.
// ---------------------------------------------------------------------------

export type IssuedInvoiceStatus =
  "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethod =
  "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "CHEQUE";

export type SalesReportRow = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customer: { id: string; name: string };
  status: IssuedInvoiceStatus;
  subTotal: string;
  totalGst: string;
  extraCharges: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
};

export type PaymentReportRow = {
  id: string;
  paidAt: string;
  invoiceId: string;
  invoiceNo: string;
  customer: { id: string; name: string };
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  amount: string;
  user: { id: string; name: string };
};

export type TaxReportRow = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customer: { id: string; name: string };
  taxable: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalGst: string;
  totalAmount: string;
};

export type CustomerReportRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  invoiceCount: number;
  quotationCount: number;
  totalBilled: string;
  collected: string;
  outstanding: string;
  lastInvoiceDate: string | null;
};

export type ProductReportRow = {
  id: string;
  name: string;
  hsn: string | null;
  qtySold: number;
  revenue: string;
  gst: string;
  currentStock: number;
  stockValue: string;
};

export type InventoryReportRow = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  lowStockAt: number;
  unit: string | null;
  status: StockStatus;
  valuation: string;
  movementsIn: number;
  movementsOut: number;
  netMovements: number;
};

export type OutstandingReportRow = {
  id: string;
  invoiceNo: string;
  customer: { id: string; name: string };
  invoiceDate: string;
  dueDate: string | null;
  status: IssuedInvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  outstanding: string;
  daysOverdue: number;
};

export type TopProductReportRow = {
  rank: number;
  id: string;
  name: string;
  qtySold: number;
  revenue: string;
  percentageOfTotal: number;
};

export type TopCustomerReportRow = {
  rank: number;
  id: string;
  name: string;
  invoiceCount: number;
  billed: string;
  collected: string;
  outstanding: string;
  percentageOfTotal: number;
};

export type RevenueTrendRow = {
  period: string;
  periodKey: string;
  invoiceCount: number;
  invoiced: string;
  gst: string;
  collected: string;
  outstanding: string;
};

export type ReportRow =
  | SalesReportRow
  | PaymentReportRow
  | TaxReportRow
  | CustomerReportRow
  | ProductReportRow
  | InventoryReportRow
  | OutstandingReportRow
  | TopProductReportRow
  | TopCustomerReportRow
  | RevenueTrendRow;

// ---------------------------------------------------------------------------
// Display labels
// ---------------------------------------------------------------------------

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  VOID: "Void",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
};

// ---------------------------------------------------------------------------
// Report column metadata
//
// A single source of truth shared by the interactive table (which layers rich
// cell renderers over these on top), the CSV export, and the print document.
// ---------------------------------------------------------------------------

export type ReportColumn<T> = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Hide the column below the given breakpoint on small screens. */
  hideBelow?: "sm" | "md" | "lg";
  /** Render the plain value with the mono font (ids, money, numbers). */
  mono?: boolean;
  /** Sum this column into the print document's totals row. */
  total?: boolean;
  value: (row: T) => string | number;
  /** Numeric value for the print totals row; required when `total` is set. */
  raw?: (row: T) => number;
};

export const REPORT_TITLES: Record<ReportType, string> = {
  sales: "Sales",
  payments: "Payments",
  tax: "Tax / GST",
  customers: "Customer Summary",
  products: "Product Summary",
  inventory: "Inventory",
  outstanding: "Outstanding",
  "top-products": "Top Selling Products",
  "top-customers": "Top Customers",
  "revenue-trends": "Revenue Trends",
};

export const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  sales: "Invoiced sales with GST, paid and outstanding balances.",
  payments: "Payments received, refunded and failed across all methods.",
  tax: "GST collected per invoice plus a rate-wise breakdown.",
  customers: "Billing activity per customer.",
  products: "Units sold, revenue and GST per product.",
  inventory: "Current stock levels and movements within the period.",
  outstanding: "Issued invoices with an outstanding balance.",
  "top-products": "Best performing products by revenue.",
  "top-customers": "Best performing customers by billing.",
  "revenue-trends": "Invoiced and collected revenue bucketed over time.",
};

const right = { align: "right" as const, mono: true as const };

export const salesColumns: ReportColumn<SalesReportRow>[] = [
  { key: "invoiceNo", label: "Invoice", value: (row) => row.invoiceNo },
  { key: "customer", label: "Customer", value: (row) => row.customer.name },
  {
    key: "invoiceDate",
    label: "Date",
    hideBelow: "md",
    value: (row) => formatDate(row.invoiceDate),
  },
  {
    key: "status",
    label: "Status",
    value: (row) => INVOICE_STATUS_LABELS[row.status] ?? row.status,
  },
  {
    key: "subTotal",
    label: "Subtotal",
    hideBelow: "lg",
    ...right,
    value: (row) => formatMoney(row.subTotal),
  },
  {
    key: "totalGst",
    label: "GST",
    hideBelow: "lg",
    ...right,
    value: (row) => formatMoney(row.totalGst),
  },
  {
    key: "extraCharges",
    label: "Extra",
    hideBelow: "lg",
    ...right,
    value: (row) => formatMoney(row.extraCharges),
  },
  {
    key: "totalAmount",
    label: "Total",
    ...right,
    total: true,
    value: (row) => formatMoney(row.totalAmount),
    raw: (row) => Number(row.totalAmount),
  },
  {
    key: "paidAmount",
    label: "Paid",
    hideBelow: "sm",
    ...right,
    total: true,
    value: (row) => formatMoney(row.paidAmount),
    raw: (row) => Number(row.paidAmount),
  },
  {
    key: "balance",
    label: "Balance",
    hideBelow: "sm",
    ...right,
    total: true,
    value: (row) => formatMoney(row.balance),
    raw: (row) => Number(row.balance),
  },
];

export const paymentColumns: ReportColumn<PaymentReportRow>[] = [
  {
    key: "paidAt",
    label: "Date",
    value: (row) => formatDate(row.paidAt),
  },
  { key: "invoiceNo", label: "Invoice", value: (row) => row.invoiceNo },
  { key: "customer", label: "Customer", value: (row) => row.customer.name },
  {
    key: "method",
    label: "Method",
    hideBelow: "md",
    value: (row) => PAYMENT_METHOD_LABELS[row.method],
  },
  {
    key: "reference",
    label: "Reference",
    hideBelow: "lg",
    ...right,
    value: (row) => row.reference ?? "—",
  },
  {
    key: "status",
    label: "Status",
    value: (row) => PAYMENT_STATUS_LABELS[row.status],
  },
  {
    key: "user",
    label: "Recorded by",
    hideBelow: "sm",
    value: (row) => row.user.name,
  },
  {
    key: "amount",
    label: "Amount",
    ...right,
    total: true,
    value: (row) => formatMoney(row.amount),
    raw: (row) => Number(row.amount),
  },
];

export const taxColumns: ReportColumn<TaxReportRow>[] = [
  { key: "invoiceNo", label: "Invoice", value: (row) => row.invoiceNo },
  { key: "customer", label: "Customer", value: (row) => row.customer.name },
  {
    key: "invoiceDate",
    label: "Date",
    hideBelow: "md",
    value: (row) => formatDate(row.invoiceDate),
  },
  {
    key: "taxable",
    label: "Taxable",
    ...right,
    total: true,
    value: (row) => formatMoney(row.taxable),
    raw: (row) => Number(row.taxable),
  },
  {
    key: "cgst",
    label: "CGST",
    ...right,
    total: true,
    value: (row) => formatMoney(row.cgst),
    raw: (row) => Number(row.cgst),
  },
  {
    key: "sgst",
    label: "SGST",
    ...right,
    total: true,
    value: (row) => formatMoney(row.sgst),
    raw: (row) => Number(row.sgst),
  },
  {
    key: "igst",
    label: "IGST",
    ...right,
    total: true,
    value: (row) => formatMoney(row.igst),
    raw: (row) => Number(row.igst),
  },
  {
    key: "totalGst",
    label: "Total GST",
    ...right,
    total: true,
    value: (row) => formatMoney(row.totalGst),
    raw: (row) => Number(row.totalGst),
  },
  {
    key: "totalAmount",
    label: "Total",
    ...right,
    total: true,
    value: (row) => formatMoney(row.totalAmount),
    raw: (row) => Number(row.totalAmount),
  },
];

export const customerColumns: ReportColumn<CustomerReportRow>[] = [
  { key: "name", label: "Customer", value: (row) => row.name },
  {
    key: "location",
    label: "Location",
    hideBelow: "md",
    value: (row) => [row.city, row.state].filter(Boolean).join(", ") || "—",
  },
  {
    key: "invoiceCount",
    label: "Invoices",
    ...right,
    value: (row) => formatNumber(row.invoiceCount),
  },
  {
    key: "quotationCount",
    label: "Quotations",
    hideBelow: "md",
    ...right,
    value: (row) => formatNumber(row.quotationCount),
  },
  {
    key: "totalBilled",
    label: "Billed",
    ...right,
    total: true,
    value: (row) => formatMoney(row.totalBilled),
    raw: (row) => Number(row.totalBilled),
  },
  {
    key: "collected",
    label: "Collected",
    ...right,
    total: true,
    value: (row) => formatMoney(row.collected),
    raw: (row) => Number(row.collected),
  },
  {
    key: "outstanding",
    label: "Outstanding",
    ...right,
    total: true,
    value: (row) => formatMoney(row.outstanding),
    raw: (row) => Number(row.outstanding),
  },
  {
    key: "lastInvoiceDate",
    label: "Last invoice",
    hideBelow: "md",
    value: (row) =>
      row.lastInvoiceDate ? formatDate(row.lastInvoiceDate) : "—",
  },
];

export const productColumns: ReportColumn<ProductReportRow>[] = [
  { key: "name", label: "Product", value: (row) => row.name },
  {
    key: "hsn",
    label: "HSN",
    hideBelow: "md",
    ...right,
    value: (row) => row.hsn ?? "—",
  },
  {
    key: "qtySold",
    label: "Qty sold",
    ...right,
    value: (row) => formatNumber(row.qtySold),
  },
  {
    key: "revenue",
    label: "Revenue",
    ...right,
    total: true,
    value: (row) => formatMoney(row.revenue),
    raw: (row) => Number(row.revenue),
  },
  {
    key: "gst",
    label: "GST",
    ...right,
    total: true,
    value: (row) => formatMoney(row.gst),
    raw: (row) => Number(row.gst),
  },
  {
    key: "currentStock",
    label: "Stock",
    ...right,
    value: (row) => formatNumber(row.currentStock),
  },
  {
    key: "stockValue",
    label: "Stock value",
    ...right,
    total: true,
    value: (row) => formatMoney(row.stockValue),
    raw: (row) => Number(row.stockValue),
  },
];

export const inventoryColumns: ReportColumn<InventoryReportRow>[] = [
  { key: "name", label: "Product", value: (row) => row.name },
  {
    key: "sku",
    label: "SKU",
    hideBelow: "md",
    ...right,
    value: (row) => row.sku ?? "—",
  },
  {
    key: "status",
    label: "Stock",
    value: (row) => STOCK_STATUS_LABELS[row.status],
  },
  {
    key: "lowStockAt",
    label: "Low at",
    hideBelow: "md",
    ...right,
    value: (row) => formatNumber(row.lowStockAt),
  },
  {
    key: "movementsIn",
    label: "In",
    ...right,
    value: (row) => formatNumber(row.movementsIn),
  },
  {
    key: "movementsOut",
    label: "Out",
    ...right,
    value: (row) => formatNumber(row.movementsOut),
  },
  {
    key: "netMovements",
    label: "Net",
    ...right,
    value: (row) => formatNumber(row.netMovements),
  },
  {
    key: "valuation",
    label: "Valuation",
    ...right,
    total: true,
    value: (row) => formatMoney(row.valuation),
    raw: (row) => Number(row.valuation),
  },
];

export const outstandingColumns: ReportColumn<OutstandingReportRow>[] = [
  { key: "invoiceNo", label: "Invoice", value: (row) => row.invoiceNo },
  { key: "customer", label: "Customer", value: (row) => row.customer.name },
  {
    key: "invoiceDate",
    label: "Invoice date",
    hideBelow: "md",
    value: (row) => formatDate(row.invoiceDate),
  },
  {
    key: "dueDate",
    label: "Due date",
    hideBelow: "md",
    value: (row) => (row.dueDate ? formatDate(row.dueDate) : "—"),
  },
  {
    key: "status",
    label: "Status",
    value: (row) => INVOICE_STATUS_LABELS[row.status] ?? row.status,
  },
  {
    key: "totalAmount",
    label: "Total",
    ...right,
    total: true,
    value: (row) => formatMoney(row.totalAmount),
    raw: (row) => Number(row.totalAmount),
  },
  {
    key: "paidAmount",
    label: "Paid",
    hideBelow: "sm",
    ...right,
    value: (row) => formatMoney(row.paidAmount),
  },
  {
    key: "outstanding",
    label: "Outstanding",
    ...right,
    total: true,
    value: (row) => formatMoney(row.outstanding),
    raw: (row) => Number(row.outstanding),
  },
  {
    key: "daysOverdue",
    label: "Days overdue",
    ...right,
    value: (row) => formatNumber(row.daysOverdue),
  },
];

export const topProductColumns: ReportColumn<TopProductReportRow>[] = [
  {
    key: "rank",
    label: "#",
    ...right,
    value: (row) => formatNumber(row.rank),
  },
  { key: "name", label: "Product", value: (row) => row.name },
  {
    key: "qtySold",
    label: "Qty sold",
    ...right,
    value: (row) => formatNumber(row.qtySold),
  },
  {
    key: "revenue",
    label: "Revenue",
    ...right,
    total: true,
    value: (row) => formatMoney(row.revenue),
    raw: (row) => Number(row.revenue),
  },
  {
    key: "percentageOfTotal",
    label: "% of total",
    ...right,
    value: (row) => `${formatNumber(row.percentageOfTotal)}%`,
  },
];

export const topCustomerColumns: ReportColumn<TopCustomerReportRow>[] = [
  {
    key: "rank",
    label: "#",
    ...right,
    value: (row) => formatNumber(row.rank),
  },
  { key: "name", label: "Customer", value: (row) => row.name },
  {
    key: "invoiceCount",
    label: "Invoices",
    ...right,
    value: (row) => formatNumber(row.invoiceCount),
  },
  {
    key: "billed",
    label: "Billed",
    ...right,
    total: true,
    value: (row) => formatMoney(row.billed),
    raw: (row) => Number(row.billed),
  },
  {
    key: "collected",
    label: "Collected",
    ...right,
    value: (row) => formatMoney(row.collected),
  },
  {
    key: "outstanding",
    label: "Outstanding",
    ...right,
    value: (row) => formatMoney(row.outstanding),
  },
  {
    key: "percentageOfTotal",
    label: "% of total",
    ...right,
    value: (row) => `${formatNumber(row.percentageOfTotal)}%`,
  },
];

export const revenueTrendColumns: ReportColumn<RevenueTrendRow>[] = [
  { key: "period", label: "Period", value: (row) => row.period },
  {
    key: "invoiceCount",
    label: "Invoices",
    ...right,
    value: (row) => formatNumber(row.invoiceCount),
  },
  {
    key: "invoiced",
    label: "Invoiced",
    ...right,
    total: true,
    value: (row) => formatMoney(row.invoiced),
    raw: (row) => Number(row.invoiced),
  },
  {
    key: "gst",
    label: "GST",
    ...right,
    total: true,
    value: (row) => formatMoney(row.gst),
    raw: (row) => Number(row.gst),
  },
  {
    key: "collected",
    label: "Collected",
    ...right,
    total: true,
    value: (row) => formatMoney(row.collected),
    raw: (row) => Number(row.collected),
  },
  {
    key: "outstanding",
    label: "Outstanding",
    ...right,
    total: true,
    value: (row) => formatMoney(row.outstanding),
    raw: (row) => Number(row.outstanding),
  },
];

export const REPORT_COLUMNS: Record<ReportType, ReportColumn<ReportRow>[]> = {
  sales: salesColumns as unknown as ReportColumn<ReportRow>[],
  payments: paymentColumns as unknown as ReportColumn<ReportRow>[],
  tax: taxColumns as unknown as ReportColumn<ReportRow>[],
  customers: customerColumns as unknown as ReportColumn<ReportRow>[],
  products: productColumns as unknown as ReportColumn<ReportRow>[],
  inventory: inventoryColumns as unknown as ReportColumn<ReportRow>[],
  outstanding: outstandingColumns as unknown as ReportColumn<ReportRow>[],
  "top-products": topProductColumns as unknown as ReportColumn<ReportRow>[],
  "top-customers": topCustomerColumns as unknown as ReportColumn<ReportRow>[],
  "revenue-trends": revenueTrendColumns as unknown as ReportColumn<ReportRow>[],
};
