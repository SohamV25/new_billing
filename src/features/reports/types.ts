import type { ReportType } from "@/lib/validations/report";
import type { ReportRow } from "@/lib/reports/columns";

export type { ReportType } from "@/lib/validations/report";

export type {
  ReportRow,
  SalesReportRow,
  PaymentReportRow,
  TaxReportRow,
  CustomerReportRow,
  ProductReportRow,
  InventoryReportRow,
  OutstandingReportRow,
  TopProductReportRow,
  TopCustomerReportRow,
  RevenueTrendRow,
} from "@/lib/reports/columns";

export type ReportQuery = {
  type: ReportType;
  from?: string;
  to?: string;
  customerId?: string;
  status?: string;
  method?: string;
  search?: string;
  topN?: number;
  granularity?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export type ReportSummaryItem = {
  label: string;
  value: string;
  hint?: string;
};

export type ReportPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type RateBreakdownEntry = {
  rate: string;
  taxable: string;
  gst: string;
};

export type ReportMeta = {
  period?: string;
  rateBreakdown?: RateBreakdownEntry[];
  topCount?: number;
  granularity?: string;
};

export type ReportResult = {
  items: ReportRow[];
  summary: ReportSummaryItem[];
  pagination: ReportPagination;
  meta?: ReportMeta;
};

export type ReportExportResult = {
  rows: ReportRow[];
  summary: ReportSummaryItem[];
  meta: ReportMeta | null;
};

export type ReportCompanyInfo = {
  companyName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string | null;
  logoUrl: string | null;
};
