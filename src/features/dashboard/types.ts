import type { DashboardQuery } from "@/lib/validations/dashboard";
import type {
  RevenueTrendRow,
  TopProductReportRow,
  TopCustomerReportRow,
} from "@/lib/reports/columns";
import type { InvoiceListItem } from "@/lib/services/invoices";
import type { PaymentListItem } from "@/lib/services/payments";
import type { CustomerListItem } from "@/lib/services/customers";
import type {
  InventoryListItem,
  MovementListItem,
} from "@/lib/services/inventory";

export type SalesGranularity = "week" | "month" | "quarter" | "year";

export type DashboardQueryClient = {
  from?: string;
  to?: string;
  topN?: number;
  granularity?: SalesGranularity;
};

export type ProductSalesData = {
  products: { id: string; name: string; revenue: string; qty: number }[];
  periods: {
    periodKey: string;
    period: string;
    values: { productId: string; revenue: string; qty: number }[];
  }[];
};

export type DashboardKpis = {
  totalRevenue: string;
  monthlyRevenue: string;
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingPayments: number;
  pendingPaymentsAmount: string;
  outstandingAmount: string;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
};

export type InvoiceStatusDistributionItem = {
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  count: number;
  amount: string;
};

export type PaymentStatusDistributionItem = {
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  count: number;
  amount: string;
};

export type DashboardData = {
  range: { from: string | null; to: string | null };
  kpis: DashboardKpis;
  revenueTrend: RevenueTrendRow[];
  salesByMonth: RevenueTrendRow[];
  productSales: ProductSalesData;
  invoiceStatusDistribution: InvoiceStatusDistributionItem[];
  paymentStatusDistribution: PaymentStatusDistributionItem[];
  topProducts: TopProductReportRow[];
  topCustomers: TopCustomerReportRow[];
  lowStock: InventoryListItem[];
  recentInvoices: InvoiceListItem[];
  recentPayments: PaymentListItem[];
  recentCustomers: CustomerListItem[];
  recentMovements: MovementListItem[];
};

export type { RevenueTrendRow, TopProductReportRow, TopCustomerReportRow };
export type {
  InvoiceListItem,
  PaymentListItem,
  CustomerListItem,
  InventoryListItem,
  MovementListItem,
};
