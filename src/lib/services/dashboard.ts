import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { runReport } from "@/lib/services/reports";
import { getPaidByInvoice } from "@/lib/services/payments";
import { listInvoices } from "@/lib/services/invoices";
import { listAllPayments } from "@/lib/services/payments";
import { listInventory, listMovements } from "@/lib/services/inventory";
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
import type { DashboardData } from "@/features/dashboard/types";

const ISSUED_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID"] as const;

const ZERO = () => new Prisma.Decimal(0);

function money(
  value: Prisma.Decimal | number | null | undefined
): Prisma.Decimal {
  if (value === null || value === undefined) return ZERO();
  if (typeof value === "number") return new Prisma.Decimal(value);
  return value;
}

function dateFilter(
  from?: Date | null,
  to?: Date | null
): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function resolveIssuedStatus(
  status: string,
  dueDate: Date | null,
  now: Date
): "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" {
  if (
    (status === "PENDING" || status === "PARTIALLY_PAID") &&
    dueDate &&
    dueDate < startOfDay(now)
  ) {
    return "OVERDUE";
  }
  return status as "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
}

type InvoiceStatusCount = {
  count: number;
  amount: Prisma.Decimal;
};

async function getCurrentMonthRange(): Promise<{ from: Date; to: Date }> {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { from, to };
}


export type SalesGranularity = "week" | "month" | "quarter" | "year";

function periodBucket(date: Date, granularity: SalesGranularity) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();

  if (granularity === "year") {
    return { key: `${year}`, label: `${year}` };
  }
  if (granularity === "quarter") {
    const q = Math.floor(date.getMonth() / 3) + 1;
    return { key: `${year}-Q${q}`, label: `Q${q} ${year}` };
  }
  if (granularity === "week") {
    // Monday-anchored weeks.
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return {
      key: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
      label: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(monday),
    };
  }
  return {
    key: `${year}-${pad(date.getMonth() + 1)}`,
    label: new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "2-digit",
    }).format(date),
  };
}

/**
 * Revenue per product per period. With a three-product catalogue this is the
 * chart that answers "what sold, and when" — one bar per product per bucket.
 */
async function getProductSalesByPeriod(
  invoiceWhere: Prisma.InvoiceWhereInput,
  granularity: SalesGranularity
) {
  const items = await prisma.invoiceItem.findMany({
    where: {
      productId: { not: null },
      // Retired products would otherwise linger in the charts as an extra
      // series with historical sales.
      product: { deletedAt: null },
      invoice: invoiceWhere,
    },
    select: {
      productId: true,
      amount: true,
      quantity: true,
      invoice: { select: { invoiceDate: true } },
      product: { select: { id: true, name: true } },
    },
  });

  const products = new Map<string, string>();
  const buckets = new Map<
    string,
    { label: string; totals: Map<string, { revenue: Prisma.Decimal; qty: number }> }
  >();

  for (const item of items) {
    if (!item.product) continue;
    products.set(item.product.id, item.product.name);

    const { key, label } = periodBucket(item.invoice.invoiceDate, granularity);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label, totals: new Map() };
      buckets.set(key, bucket);
    }
    let entry = bucket.totals.get(item.product.id);
    if (!entry) {
      entry = { revenue: ZERO(), qty: 0 };
      bucket.totals.set(item.product.id, entry);
    }
    entry.revenue = entry.revenue.plus(money(item.amount));
    entry.qty += money(item.quantity).toNumber();
  }

  const totals = new Map<string, { revenue: Prisma.Decimal; qty: number }>();
  for (const bucket of buckets.values()) {
    for (const [productId, entry] of bucket.totals) {
      const running = totals.get(productId) ?? { revenue: ZERO(), qty: 0 };
      running.revenue = running.revenue.plus(entry.revenue);
      running.qty += entry.qty;
      totals.set(productId, running);
    }
  }

  const productList = [...products.entries()]
    .map(([id, name]) => ({
      id,
      name,
      revenue: (totals.get(id)?.revenue ?? ZERO()).toString(),
      qty: totals.get(id)?.qty ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const periods = [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, bucket]) => ({
      periodKey: key,
      period: bucket.label,
      values: productList.map((product) => {
        const entry = bucket.totals.get(product.id);
        return {
          productId: product.id,
          revenue: (entry?.revenue ?? ZERO()).toString(),
          qty: entry?.qty ?? 0,
        };
      }),
    }));

  return { products: productList, periods };
}

export async function getDashboardData(
  query: DashboardQuery
): Promise<DashboardData> {
  const now = new Date();
  const from = query.from ?? null;
  const to = query.to ?? null;
  const topN = query.topN ?? 5;

  const dateWhere = dateFilter(from, to);

  // ---------------------------------------------------------------------------
  // 1. KPIs & Invoice Status Distribution (inside a single transaction)
  // ---------------------------------------------------------------------------
  const invoiceWhereBase: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) invoiceWhereBase.invoiceDate = dateWhere;

  const { from: monthFrom, to: monthTo } = await getCurrentMonthRange();

  const [
    issuedInvoices,
    totalCustomers,
    activeCustomersResult,
    totalProducts,
    monthlyInvoices,
  ] = await prisma.$transaction([
    // All issued invoices in range (for KPIs + invoice status distribution)
    prisma.invoice.findMany({
      where: invoiceWhereBase,
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        dueDate: true,
        status: true,
        totalAmount: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
      },
    }),
    // Total customers
    prisma.customer.count({ where: { deletedAt: null } }),
    // Active customers (distinct customers with issued invoices in range)
    prisma.invoice.groupBy({
      by: ["customerId"],
      where: invoiceWhereBase,
      orderBy: { customerId: "asc" },
    }),
    // Total products
    prisma.product.count({ where: { deletedAt: null } }),
    // Monthly revenue (current calendar month)
    prisma.invoice.findMany({
      where: {
        status: { in: [...ISSUED_STATUSES] },
        invoiceDate: { gte: monthFrom, lte: monthTo },
      },
      select: { totalAmount: true },
    }),
  ]);

  // Get paid amounts for issued invoices
  const paidByInvoice = await getPaidByInvoice(
    (issuedInvoices as { id: string }[]).map((inv) => inv.id)
  );

  // Compute KPIs from issued invoices
  let totalRevenue = ZERO();
  let pendingPayments = 0;
  let pendingPaymentsAmount = ZERO();
  let outstandingAmount = ZERO();
  let paidInvoices = 0;
  let unpaidInvoices = 0;
  const totalInvoices = issuedInvoices.length;

  const invoiceStatusCounts: Record<
    "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE",
    InvoiceStatusCount
  > = {
    PENDING: { count: 0, amount: ZERO() },
    PARTIALLY_PAID: { count: 0, amount: ZERO() },
    PAID: { count: 0, amount: ZERO() },
    OVERDUE: { count: 0, amount: ZERO() },
  };

  for (const invoice of issuedInvoices) {
    const paidAmount = paidByInvoice.get(invoice.id) ?? ZERO();
    const balance = invoice.totalAmount.minus(paidAmount);

    totalRevenue = totalRevenue.plus(invoice.totalAmount);

    const derivedStatus = resolveIssuedStatus(
      invoice.status,
      invoice.dueDate,
      now
    );

    // Invoice status distribution
    invoiceStatusCounts[derivedStatus].count += 1;
    invoiceStatusCounts[derivedStatus].amount = invoiceStatusCounts[
      derivedStatus
    ].amount.plus(invoice.totalAmount);

    if (balance.gt(0)) {
      pendingPayments += 1;
      pendingPaymentsAmount = pendingPaymentsAmount.plus(balance);
      outstandingAmount = outstandingAmount.plus(balance);
      unpaidInvoices += 1;
    } else {
      paidInvoices += 1;
    }
  }

  // Monthly revenue
  let monthlyRevenue = ZERO();
  for (const inv of monthlyInvoices) {
    monthlyRevenue = monthlyRevenue.plus(inv.totalAmount);
  }

  // ---------------------------------------------------------------------------
  // 2. Low stock products (from inventory summary)
  // ---------------------------------------------------------------------------
  const inventoryResult = await listInventory({
    search: "",
    page: 1,
    pageSize: 500,
  });
  const lowStockItems = inventoryResult.items
    .filter(
      (item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK"
    )
    .slice(0, 8);

  // ---------------------------------------------------------------------------
  // 3. Revenue trends & Sales by month (reuse runReport)
  // ---------------------------------------------------------------------------
  const reportQueryBase = {
    from: from ?? undefined,
    to: to ?? undefined,
  };

  const [revenueTrendResult, salesByMonthResult] = await Promise.all([
    runReport(
      { type: "revenue-trends", ...reportQueryBase, granularity: "auto" },
      { page: 1, pageSize: 200 }
    ),
    runReport(
      { type: "revenue-trends", ...reportQueryBase, granularity: "month" },
      { page: 1, pageSize: 200 }
    ),
  ]);

  const productSales = await getProductSalesByPeriod(
    invoiceWhereBase,
    query.granularity ?? "month"
  );

  // ---------------------------------------------------------------------------
  // 4. Top products & Top customers (reuse runReport)
  // ---------------------------------------------------------------------------
  const [topProductsResult, topCustomersResult] = await Promise.all([
    runReport(
      { type: "top-products", ...reportQueryBase, topN },
      { page: 1, pageSize: topN }
    ),
    runReport(
      { type: "top-customers", ...reportQueryBase, topN },
      { page: 1, pageSize: topN }
    ),
  ]);

  // ---------------------------------------------------------------------------
  // 6. Payment status distribution
  // ---------------------------------------------------------------------------
  const paymentStatusResult = await prisma.payment.groupBy({
    by: ["status"],
    where: {
      paidAt: dateWhere ?? undefined,
    },
    _count: { _all: true },
    _sum: { amount: true },
  });

  const paymentStatusDistribution = [
    { status: "PENDING" as const, count: 0, amount: ZERO() },
    { status: "COMPLETED" as const, count: 0, amount: ZERO() },
    { status: "FAILED" as const, count: 0, amount: ZERO() },
    { status: "REFUNDED" as const, count: 0, amount: ZERO() },
  ];

  for (const row of paymentStatusResult) {
    const idx = paymentStatusDistribution.findIndex(
      (s) => s.status === row.status
    );
    if (idx >= 0) {
      paymentStatusDistribution[idx].count = row._count._all;
      paymentStatusDistribution[idx].amount = money(row._sum.amount);
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Recent feeds
  // ---------------------------------------------------------------------------
  const [recentInvoicesResult, recentPaymentsResult, recentMovementsResult] =
    await Promise.all([
      listInvoices({ search: "", status: null, page: 1, pageSize: 5 }),
      listAllPayments({
        search: "",
        method: null,
        status: null,
        page: 1,
        pageSize: 5,
      }),
      listMovements({ search: "", page: 1, pageSize: 5 }),
    ]);

  // For recent customers, we want recently created, not alphabetical
  const recentCustomersData = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { _count: { select: { invoices: true, quotations: true } } },
  });

  const recentCustomers: CustomerListItem[] = recentCustomersData.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    state: c.state,
    pincode: c.pincode,
    gstin: c.gstin,
    invoiceCount: c._count.invoices,
    quotationCount: c._count.quotations,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return {
    range: {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    kpis: {
      totalRevenue: totalRevenue.toString(),
      monthlyRevenue: monthlyRevenue.toString(),
      totalCustomers,
      activeCustomers: activeCustomersResult.length,
      totalProducts,
      lowStockProducts:
        inventoryResult.summary.lowStock + inventoryResult.summary.outOfStock,
      pendingPayments,
      pendingPaymentsAmount: pendingPaymentsAmount.toString(),
      outstandingAmount: outstandingAmount.toString(),
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
    },
    revenueTrend: revenueTrendResult.items as RevenueTrendRow[],
    salesByMonth: salesByMonthResult.items as RevenueTrendRow[],
    productSales,
    invoiceStatusDistribution: [
      {
        status: "PENDING",
        count: invoiceStatusCounts.PENDING.count,
        amount: invoiceStatusCounts.PENDING.amount.toString(),
      },
      {
        status: "PARTIALLY_PAID",
        count: invoiceStatusCounts.PARTIALLY_PAID.count,
        amount: invoiceStatusCounts.PARTIALLY_PAID.amount.toString(),
      },
      {
        status: "PAID",
        count: invoiceStatusCounts.PAID.count,
        amount: invoiceStatusCounts.PAID.amount.toString(),
      },
      {
        status: "OVERDUE",
        count: invoiceStatusCounts.OVERDUE.count,
        amount: invoiceStatusCounts.OVERDUE.amount.toString(),
      },
    ],
    paymentStatusDistribution: paymentStatusDistribution.map((s) => ({
      status: s.status,
      count: s.count,
      amount: s.amount.toString(),
    })),
    topProducts: topProductsResult.items as TopProductReportRow[],
    topCustomers: topCustomersResult.items as TopCustomerReportRow[],
    lowStock: lowStockItems,
    recentInvoices: recentInvoicesResult.items,
    recentPayments: recentPaymentsResult.items,
    recentCustomers,
    recentMovements: recentMovementsResult.items,
  };
}
