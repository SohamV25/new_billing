import {
  Prisma,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/generated/prisma/client";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type {
  CustomerReportRow,
  InventoryReportRow,
  IssuedInvoiceStatus,
  OutstandingReportRow,
  PaymentReportRow,
  ProductReportRow,
  ReportRow,
  RevenueTrendRow,
  SalesReportRow,
  StockStatus,
  TaxReportRow,
  TopCustomerReportRow,
  TopProductReportRow,
} from "@/lib/reports/columns";
import { prisma } from "@/lib/prisma";
import { computeStockStatus } from "@/lib/services/inventory";
import { getPaidByInvoice } from "@/lib/services/payments";
import type { ReportQuery } from "@/lib/validations/report";

// ---------------------------------------------------------------------------
// Shared result types
// ---------------------------------------------------------------------------

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

export type ReportOptions = {
  page: number;
  pageSize: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISSUED_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID"] as const;

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

const ZERO = () => new Prisma.Decimal(0);

function money(
  value: Prisma.Decimal | number | null | undefined
): Prisma.Decimal {
  if (value === null || value === undefined) return ZERO();
  if (typeof value === "number") return new Prisma.Decimal(value);
  return value;
}

function dateFilter(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function periodLabel(from?: Date, to?: Date): string | undefined {
  if (!from && !to) return undefined;
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  return to ? `Up to ${formatDate(to)}` : undefined;
}

function resolveIssuedStatus(
  status: InvoiceStatus,
  dueDate: Date | null,
  now: Date
): IssuedInvoiceStatus {
  if (
    (status === "PENDING" || status === "PARTIALLY_PAID") &&
    dueDate &&
    dueDate < startOfDay(now)
  ) {
    return "OVERDUE";
  }
  return status as IssuedInvoiceStatus;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

function percent(part: Prisma.Decimal, total: Prisma.Decimal): number {
  if (total.isZero()) return 0;
  return part.div(total).times(100).toDecimalPlaces(1).toNumber();
}

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; pagination: ReportPagination } {
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  };
}

// ---------------------------------------------------------------------------
// Report implementations
// ---------------------------------------------------------------------------

/**
 * Sales report: issued invoices within the period with GST, paid and
 * outstanding balances. Status is resolved at read time (OVERDUE is derived).
 */
async function salesReport(
  query: Extract<ReportQuery, { type: "sales" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const where: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) where.invoiceDate = dateWhere;
  if (query.customerId) where.customerId = query.customerId;
  if (query.search) {
    where.OR = [
      { invoiceNo: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.status) {
    if (query.status === "OVERDUE") {
      where.status = { in: ["PENDING", "PARTIALLY_PAID"] };
      where.dueDate = { lt: new Date() };
    } else {
      where.status = query.status;
    }
  }

  const [invoices, total, totals, collected] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        dueDate: true,
        status: true,
        customer: { select: { id: true, name: true } },
        subTotal: true,
        totalCgst: true,
        totalSgst: true,
        totalIgst: true,
        extraCharges: true,
        totalAmount: true,
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: {
        totalAmount: true,
        totalCgst: true,
        totalSgst: true,
        totalIgst: true,
      },
    }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED", invoice: where },
      _sum: { amount: true },
    }),
  ]);

  const paidByInvoice = await getPaidByInvoice(invoices.map((item) => item.id));
  const now = new Date();

  const items: SalesReportRow[] = invoices.map((invoice) => {
    const paidAmount = paidByInvoice.get(invoice.id) ?? new Prisma.Decimal(0);
    const totalGst = invoice.totalCgst
      .plus(invoice.totalSgst)
      .plus(invoice.totalIgst);
    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate.toISOString(),
      customer: invoice.customer,
      status: resolveIssuedStatus(invoice.status, invoice.dueDate, now),
      subTotal: invoice.subTotal.toString(),
      totalGst: totalGst.toString(),
      extraCharges: invoice.extraCharges.toString(),
      totalAmount: invoice.totalAmount.toString(),
      paidAmount: paidAmount.toString(),
      balance: invoice.totalAmount.minus(paidAmount).toString(),
    };
  });

  const invoiced = money(totals._sum.totalAmount);
  const totalGst = money(totals._sum.totalCgst)
    .plus(money(totals._sum.totalSgst))
    .plus(money(totals._sum.totalIgst));
  const collectedAmount = money(collected._sum.amount);

  const summary: ReportSummaryItem[] = [
    { label: "Invoices", value: formatNumber(total) },
    { label: "Total billed", value: formatMoney(invoiced.toString()) },
    { label: "GST", value: formatMoney(totalGst.toString()) },
    { label: "Collected", value: formatMoney(collectedAmount.toString()) },
    {
      label: "Outstanding",
      value: formatMoney(invoiced.minus(collectedAmount).toString()),
    },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    items,
    summary,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    ...(period ? { meta: { period } } : {}),
  };
}

/**
 * Payments report: payments received within the period across all methods.
 */
async function paymentReport(
  query: Extract<ReportQuery, { type: "payments" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const baseWhere: Prisma.PaymentWhereInput = {};
  if (dateWhere) baseWhere.paidAt = dateWhere;
  if (query.customerId) baseWhere.invoice = { customerId: query.customerId };
  if (query.search) {
    baseWhere.AND = [
      {
        OR: [
          {
            invoice: {
              invoiceNo: { contains: query.search, mode: "insensitive" },
            },
          },
          {
            invoice: {
              customer: {
                name: { contains: query.search, mode: "insensitive" },
              },
            },
          },
          { reference: { contains: query.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const where = query.status
    ? { ...baseWhere, status: query.status }
    : baseWhere;

  const [payments, total, received, refunded, failed] =
    await prisma.$transaction([
      prisma.payment.findMany({
        where,
        orderBy: { paidAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          invoice: {
            select: {
              invoiceNo: true,
              customer: { select: { id: true, name: true } },
            },
          },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { ...baseWhere, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...baseWhere, status: "REFUNDED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...baseWhere, status: "FAILED" },
        _sum: { amount: true },
      }),
    ]);

  const items: PaymentReportRow[] = payments.map((payment) => ({
    id: payment.id,
    paidAt: payment.paidAt.toISOString(),
    invoiceId: payment.invoiceId,
    invoiceNo: payment.invoice.invoiceNo,
    customer: payment.invoice.customer,
    method: payment.method as PaymentMethod,
    status: payment.status as PaymentStatus,
    reference: payment.reference,
    amount: payment.amount.toString(),
    user: payment.user,
  }));

  const allTotal = await prisma.payment.count({ where: baseWhere });

  const summary: ReportSummaryItem[] = [
    { label: "Transactions", value: formatNumber(allTotal) },
    {
      label: "Received",
      value: formatMoney(money(received._sum.amount).toString()),
    },
    {
      label: "Refunded",
      value: formatMoney(money(refunded._sum.amount).toString()),
    },
    {
      label: "Failed",
      value: formatMoney(money(failed._sum.amount).toString()),
    },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    items,
    summary,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    ...(period ? { meta: { period } } : {}),
  };
}

/**
 * Tax / GST report: per-invoice GST split plus a rate-wise breakdown of the
 * period's collected taxes.
 */
async function taxReport(
  query: Extract<ReportQuery, { type: "tax" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const where: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) where.invoiceDate = dateWhere;
  if (query.customerId) where.customerId = query.customerId;

  const [invoices, total, totals] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        customer: { select: { id: true, name: true } },
        subTotal: true,
        totalCgst: true,
        totalSgst: true,
        totalIgst: true,
        totalAmount: true,
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: {
        subTotal: true,
        totalCgst: true,
        totalSgst: true,
        totalIgst: true,
      },
    }),
  ]);

  const items: TaxReportRow[] = invoices.map((invoice) => {
    const totalGst = invoice.totalCgst
      .plus(invoice.totalSgst)
      .plus(invoice.totalIgst);
    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate.toISOString(),
      customer: invoice.customer,
      taxable: invoice.subTotal.toString(),
      cgst: invoice.totalCgst.toString(),
      sgst: invoice.totalSgst.toString(),
      igst: invoice.totalIgst.toString(),
      totalGst: totalGst.toString(),
      totalAmount: invoice.totalAmount.toString(),
    };
  });

  // The invoice items store GST as a CGST/SGST/IGST split (no combined rate
  // column), so the rate-wise breakdown combines the three rates in JS.
  const itemRows = await prisma.invoiceItem.findMany({
    where: { invoice: where },
    select: {
      amount: true,
      cgstRate: true,
      sgstRate: true,
      igstRate: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
    },
  });

  const rateMap = new Map<
    string,
    { taxable: Prisma.Decimal; gst: Prisma.Decimal }
  >();
  for (const item of itemRows) {
    const combined = item.cgstRate.plus(item.sgstRate).plus(item.igstRate);
    if (combined.isZero()) continue;
    const rateKey = combined.toString();
    let entry = rateMap.get(rateKey);
    if (!entry) {
      entry = { taxable: ZERO(), gst: ZERO() };
      rateMap.set(rateKey, entry);
    }
    entry.taxable = entry.taxable.plus(item.amount);
    entry.gst = entry.gst
      .plus(item.cgstAmount)
      .plus(item.sgstAmount)
      .plus(item.igstAmount);
  }

  const rateBreakdown: RateBreakdownEntry[] = [...rateMap.entries()]
    .sort((a, b) =>
      new Prisma.Decimal(b[0]).minus(new Prisma.Decimal(a[0])).toNumber()
    )
    .map(([rate, entry]) => ({
      rate: `${rate}%`,
      taxable: entry.taxable.toString(),
      gst: entry.gst.toString(),
    }));

  const taxable = money(totals._sum.subTotal);
  const cgst = money(totals._sum.totalCgst);
  const sgst = money(totals._sum.totalSgst);
  const igst = money(totals._sum.totalIgst);

  const summary: ReportSummaryItem[] = [
    { label: "Taxable", value: formatMoney(taxable.toString()) },
    { label: "CGST", value: formatMoney(cgst.toString()) },
    { label: "SGST", value: formatMoney(sgst.toString()) },
    { label: "IGST", value: formatMoney(igst.toString()) },
    {
      label: "Total GST",
      value: formatMoney(cgst.plus(sgst).plus(igst).toString()),
    },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    items,
    summary,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    meta: {
      ...(period ? { period } : {}),
      rateBreakdown,
    },
  };
}

/**
 * Customer summary: billing, collections and outstanding per customer within
 * the period. Collections are attributed to the invoices they settle, so the
 * per-customer outstanding equals billed minus collected.
 */
async function customerReport(
  query: Extract<ReportQuery, { type: "customers" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const customerIds: string[] = [];
  if (query.search) {
    const matches = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        name: { contains: query.search, mode: "insensitive" },
      },
      select: { id: true },
    });
    customerIds.push(...matches.map((customer) => customer.id));
  }

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) invoiceWhere.invoiceDate = dateWhere;
  if (query.search) invoiceWhere.customerId = { in: customerIds };

  const invoiceRows = await prisma.invoice.findMany({
    where: invoiceWhere,
    select: {
      id: true,
      customerId: true,
      totalAmount: true,
      invoiceDate: true,
    },
  });

  const paidByInvoice = await getPaidByInvoice(
    invoiceRows.map((row) => row.id)
  );

  const agg = new Map<
    string,
    {
      invoiceCount: number;
      totalBilled: Prisma.Decimal;
      collected: Prisma.Decimal;
      lastInvoiceDate: Date | null;
    }
  >();
  for (const row of invoiceRows) {
    let entry = agg.get(row.customerId);
    if (!entry) {
      entry = {
        invoiceCount: 0,
        totalBilled: ZERO(),
        collected: ZERO(),
        lastInvoiceDate: null,
      };
      agg.set(row.customerId, entry);
    }
    entry.invoiceCount += 1;
    entry.totalBilled = entry.totalBilled.plus(row.totalAmount);
    const paid = paidByInvoice.get(row.id);
    if (paid) entry.collected = entry.collected.plus(paid);
    if (!entry.lastInvoiceDate || row.invoiceDate > entry.lastInvoiceDate) {
      entry.lastInvoiceDate = row.invoiceDate;
    }
  }

  const quotationRows = await prisma.quotation.groupBy({
    by: ["customerId"],
    where: {
      ...(dateWhere ? { date: dateWhere } : {}),
      ...(query.search ? { customerId: { in: customerIds } } : {}),
    },
    _count: { _all: true },
  });
  const quotationCountByCustomer = new Map(
    quotationRows.map((row) => [row.customerId, row._count._all])
  );

  const customers = await prisma.customer.findMany({
    where: { id: { in: [...agg.keys()] } },
    select: { id: true, name: true, city: true, state: true },
  });
  const customerMap = new Map(
    customers.map((customer) => [customer.id, customer])
  );

  const rows: CustomerReportRow[] = [];
  let totalBilled = ZERO();
  let collected = ZERO();
  for (const customerId of agg.keys()) {
    const customer = customerMap.get(customerId);
    if (!customer) continue;
    const entry = agg.get(customerId)!;
    totalBilled = totalBilled.plus(entry.totalBilled);
    collected = collected.plus(entry.collected);
    rows.push({
      id: customerId,
      name: customer.name,
      city: customer.city,
      state: customer.state,
      invoiceCount: entry.invoiceCount,
      quotationCount: quotationCountByCustomer.get(customerId) ?? 0,
      totalBilled: entry.totalBilled.toString(),
      collected: entry.collected.toString(),
      outstanding: entry.totalBilled.minus(entry.collected).toString(),
      lastInvoiceDate: entry.lastInvoiceDate?.toISOString() ?? null,
    });
  }

  rows.sort((a, b) => Number(b.totalBilled) - Number(a.totalBilled));

  const summary: ReportSummaryItem[] = [
    { label: "Customers", value: formatNumber(rows.length) },
    { label: "Total billed", value: formatMoney(totalBilled.toString()) },
    { label: "Collected", value: formatMoney(collected.toString()) },
    {
      label: "Outstanding",
      value: formatMoney(totalBilled.minus(collected).toString()),
    },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    ...paginate(rows, page, pageSize),
    summary,
    ...(period ? { meta: { period } } : {}),
  };
}

/**
 * Product summary: units sold, revenue and GST per product within the period,
 * alongside the current stock level and valuation.
 */
async function productReport(
  query: Extract<ReportQuery, { type: "products" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) invoiceWhere.invoiceDate = dateWhere;

  const productWhere: Prisma.ProductWhereInput = { deletedAt: null };
  if (query.search) {
    productWhere.name = { contains: query.search, mode: "insensitive" };
  }

  const grouped = await prisma.invoiceItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      invoice: invoiceWhere,
      product: productWhere,
    },
    _sum: {
      quantity: true,
      amount: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
    },
  });

  const productIds = grouped
    .map((row) => row.productId)
    .filter((id): id is string => id !== null);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      hsn: true,
      price: true,
      inventory: { select: { quantity: true } },
    },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const rows: ProductReportRow[] = [];
  let unitsSold = 0;
  let revenue = ZERO();
  let gst = ZERO();
  for (const row of grouped) {
    const product = row.productId ? productMap.get(row.productId) : undefined;
    if (!product) continue;
    const qtySold = money(row._sum.quantity).toNumber();
    const rowRevenue = money(row._sum.amount);
    const rowGst = money(row._sum.cgstAmount)
      .plus(money(row._sum.sgstAmount))
      .plus(money(row._sum.igstAmount));
    const currentStock = product.inventory?.quantity ?? 0;
    const stockValue = new Prisma.Decimal(currentStock).times(product.price);
    unitsSold += qtySold;
    revenue = revenue.plus(rowRevenue);
    gst = gst.plus(rowGst);
    rows.push({
      id: product.id,
      name: product.name,
      hsn: product.hsn,
      qtySold,
      revenue: rowRevenue.toString(),
      gst: rowGst.toString(),
      currentStock,
      stockValue: stockValue.toString(),
    });
  }

  rows.sort((a, b) => Number(b.revenue) - Number(a.revenue));

  const summary: ReportSummaryItem[] = [
    { label: "Products", value: formatNumber(rows.length) },
    { label: "Units sold", value: formatNumber(unitsSold) },
    { label: "Revenue", value: formatMoney(revenue.toString()) },
    { label: "GST", value: formatMoney(gst.toString()) },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    ...paginate(rows, page, pageSize),
    summary,
    ...(period ? { meta: { period } } : {}),
  };
}

/**
 * Inventory report: current stock levels with movement totals within the
 * period. Stock status is evaluated in JS because Prisma cannot compare the
 * `quantity` and `lowStockAt` columns inside a `where` clause.
 */
async function inventoryReport(
  query: Extract<ReportQuery, { type: "inventory" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const productWhere: Prisma.ProductWhereInput = { deletedAt: null };

  const rows = await prisma.inventory.findMany({
    where: { product: productWhere },
    orderBy: { product: { name: "asc" } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          price: true,
            },
      },
    },
  });

  const movementWhere: Prisma.StockMovementWhereInput = {
    productId: { in: rows.map((row) => row.productId) },
  };
  if (dateWhere) movementWhere.createdAt = dateWhere;

  const movementRows = await prisma.stockMovement.groupBy({
    by: ["productId", "type"],
    where: movementWhere,
    _sum: { quantity: true },
  });

  const movementsByProduct = new Map<string, { in: number; out: number }>();
  for (const row of movementRows) {
    if (row.type === "ADJUSTMENT") continue;
    let entry = movementsByProduct.get(row.productId);
    if (!entry) {
      entry = { in: 0, out: 0 };
      movementsByProduct.set(row.productId, entry);
    }
    const quantity = money(row._sum.quantity).toNumber();
    if (row.type === "IN") entry.in += quantity;
    else entry.out += quantity;
  }

  const statusToFilter: Record<"in" | "low" | "out", StockStatus> = {
    in: "IN_STOCK",
    low: "LOW_STOCK",
    out: "OUT_OF_STOCK",
  };

  const rowsWithStatus: { row: (typeof rows)[number]; status: StockStatus }[] =
    rows.map((row) => ({
      row,
      status: computeStockStatus(row.quantity, row.lowStockAt),
    }));

  const statusFilter = query.status ? statusToFilter[query.status] : undefined;
  const matching = statusFilter
    ? rowsWithStatus.filter((entry) => entry.status === statusFilter)
    : rowsWithStatus;

  let totalValuation = ZERO();
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  for (const entry of rowsWithStatus) {
    const valuation = new Prisma.Decimal(entry.row.quantity).times(
      entry.row.product.price
    );
    totalValuation = totalValuation.plus(valuation);
    if (entry.status === "IN_STOCK") inStock += 1;
    else if (entry.status === "LOW_STOCK") lowStock += 1;
    else outOfStock += 1;
  }

  const items: InventoryReportRow[] = matching.map((entry) => {
    const { row } = entry;
    const movements = movementsByProduct.get(row.productId) ?? {
      in: 0,
      out: 0,
    };
    return {
      id: row.product.id,
      name: row.product.name,
      sku: row.product.sku,
      quantity: row.quantity,
      lowStockAt: row.lowStockAt,
      unit: row.product.unit,
      status: entry.status,
      valuation: new Prisma.Decimal(row.quantity)
        .times(row.product.price)
        .toString(),
      movementsIn: movements.in,
      movementsOut: movements.out,
      netMovements: movements.in - movements.out,
    };
  });

  const summary: ReportSummaryItem[] = [
    { label: "Items", value: formatNumber(rows.length) },
    { label: "In stock", value: formatNumber(inStock) },
    { label: "Low stock", value: formatNumber(lowStock) },
    { label: "Out of stock", value: formatNumber(outOfStock) },
    { label: "Stock value", value: formatMoney(totalValuation.toString()) },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    ...paginate(items, page, pageSize),
    summary,
    ...(period ? { meta: { period } } : {}),
  };
}

/**
 * Outstanding report: issued invoices with a remaining balance. OVERDUE is
 * derived from the due date and can be isolated with the `overdueOnly` filter.
 */
async function outstandingReport(
  query: Extract<ReportQuery, { type: "outstanding" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const now = new Date();

  const where: Prisma.InvoiceWhereInput = {
    status: { in: ["PENDING", "PARTIALLY_PAID"] },
  };
  if (query.customerId) where.customerId = query.customerId;
  if (query.search) {
    where.OR = [
      { invoiceNo: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      dueDate: true,
      status: true,
      totalAmount: true,
      customer: { select: { id: true, name: true } },
    },
  });

  const paidByInvoice = await getPaidByInvoice(invoices.map((item) => item.id));

  const rows: OutstandingReportRow[] = [];
  for (const invoice of invoices) {
    const paidAmount = paidByInvoice.get(invoice.id) ?? new Prisma.Decimal(0);
    const outstanding = invoice.totalAmount.minus(paidAmount);
    if (outstanding.lte(0)) continue;
    const isOverdue =
      invoice.dueDate !== null && invoice.dueDate < startOfDay(now);
    if (query.overdueOnly && !isOverdue) continue;
    rows.push({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customer: invoice.customer,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      status: resolveIssuedStatus(invoice.status, invoice.dueDate, now),
      totalAmount: invoice.totalAmount.toString(),
      paidAmount: paidAmount.toString(),
      outstanding: outstanding.toString(),
      daysOverdue:
        invoice.dueDate !== null && invoice.dueDate < startOfDay(now)
          ? daysBetween(invoice.dueDate, now)
          : 0,
    });
  }

  rows.sort(
    (a, b) =>
      b.daysOverdue - a.daysOverdue ||
      (a.dueDate && b.dueDate
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : 0)
  );

  let totalOutstanding = ZERO();
  let overdueOutstanding = ZERO();
  let overdueCount = 0;
  for (const row of rows) {
    const outstanding = new Prisma.Decimal(row.outstanding);
    totalOutstanding = totalOutstanding.plus(outstanding);
    if (row.status === "OVERDUE") {
      overdueOutstanding = overdueOutstanding.plus(outstanding);
      overdueCount += 1;
    }
  }

  const summary: ReportSummaryItem[] = [
    { label: "Invoices", value: formatNumber(rows.length) },
    { label: "Outstanding", value: formatMoney(totalOutstanding.toString()) },
    {
      label: "Overdue",
      value: formatMoney(overdueOutstanding.toString()),
      hint: `${formatNumber(overdueCount)} invoice${overdueCount === 1 ? "" : "s"}`,
    },
  ];

  return {
    ...paginate(rows, page, pageSize),
    summary,
  };
}

/**
 * Top selling products by revenue within the period.
 */
async function topProductsReport(
  query: Extract<ReportQuery, { type: "top-products" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) invoiceWhere.invoiceDate = dateWhere;

  const productWhere: Prisma.ProductWhereInput = { deletedAt: null };

  const topN = query.topN ?? 10;

  const grouped = await prisma.invoiceItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      invoice: invoiceWhere,
      product: productWhere,
    },
    _sum: { quantity: true, amount: true },
  });

  const totalRevenue = grouped.reduce(
    (sum, row) => sum.plus(money(row._sum.amount)),
    ZERO()
  );

  const productIds = grouped
    .map((row) => row.productId)
    .filter((id): id is string => id !== null);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const rows: TopProductReportRow[] = [];
  let unitsSold = 0;
  for (const row of grouped) {
    const product = row.productId ? productMap.get(row.productId) : undefined;
    if (!product) continue;
    const qtySold = money(row._sum.quantity).toNumber();
    const revenue = money(row._sum.amount);
    unitsSold += qtySold;
    rows.push({
      rank: 0,
      id: product.id,
      name: product.name,
      qtySold,
      revenue: revenue.toString(),
      percentageOfTotal: percent(revenue, totalRevenue),
    });
  }

  rows
    .sort((a, b) => Number(b.revenue) - Number(a.revenue))
    .slice(0, topN)
    .forEach((row, index) => {
      row.rank = index + 1;
    });
  rows.length = Math.min(rows.length, topN);

  const rankedRevenue = rows.reduce(
    (sum, row) => sum.plus(new Prisma.Decimal(row.revenue)),
    ZERO()
  );

  const summary: ReportSummaryItem[] = [
    { label: "Products", value: formatNumber(rows.length) },
    { label: "Units sold", value: formatNumber(unitsSold) },
    { label: "Revenue", value: formatMoney(rankedRevenue.toString()) },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    ...paginate(rows, page, pageSize),
    summary,
    meta: {
      ...(period ? { period } : {}),
      topCount: topN,
    },
  };
}

/**
 * Top customers by billed amount within the period.
 */
async function topCustomersReport(
  query: Extract<ReportQuery, { type: "top-customers" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) invoiceWhere.invoiceDate = dateWhere;

  const topN = query.topN ?? 10;

  const invoiceRows = await prisma.invoice.findMany({
    where: invoiceWhere,
    select: { id: true, customerId: true, totalAmount: true },
  });

  const paidByInvoice = await getPaidByInvoice(
    invoiceRows.map((row) => row.id)
  );

  const agg = new Map<
    string,
    { invoiceCount: number; billed: Prisma.Decimal; collected: Prisma.Decimal }
  >();
  for (const row of invoiceRows) {
    let entry = agg.get(row.customerId);
    if (!entry) {
      entry = { invoiceCount: 0, billed: ZERO(), collected: ZERO() };
      agg.set(row.customerId, entry);
    }
    entry.invoiceCount += 1;
    entry.billed = entry.billed.plus(row.totalAmount);
    const paid = paidByInvoice.get(row.id);
    if (paid) entry.collected = entry.collected.plus(paid);
  }

  const customers = await prisma.customer.findMany({
    where: { id: { in: [...agg.keys()] } },
    select: { id: true, name: true },
  });
  const customerMap = new Map(
    customers.map((customer) => [customer.id, customer])
  );

  let totalBilled = ZERO();
  let totalCollected = ZERO();
  const rows: TopCustomerReportRow[] = [];
  for (const customerId of agg.keys()) {
    const customer = customerMap.get(customerId);
    if (!customer) continue;
    const entry = agg.get(customerId)!;
    totalBilled = totalBilled.plus(entry.billed);
    totalCollected = totalCollected.plus(entry.collected);
    rows.push({
      rank: 0,
      id: customerId,
      name: customer.name,
      invoiceCount: entry.invoiceCount,
      billed: entry.billed.toString(),
      collected: entry.collected.toString(),
      outstanding: entry.billed.minus(entry.collected).toString(),
      percentageOfTotal: percent(entry.billed, totalBilled),
    });
  }

  rows
    .sort((a, b) => Number(b.billed) - Number(a.billed))
    .slice(0, topN)
    .forEach((row, index) => {
      row.rank = index + 1;
    });
  rows.length = Math.min(rows.length, topN);

  const summary: ReportSummaryItem[] = [
    { label: "Customers", value: formatNumber(rows.length) },
    { label: "Billed", value: formatMoney(totalBilled.toString()) },
    { label: "Collected", value: formatMoney(totalCollected.toString()) },
    {
      label: "Outstanding",
      value: formatMoney(totalBilled.minus(totalCollected).toString()),
    },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    ...paginate(rows, page, pageSize),
    summary,
    meta: {
      ...(period ? { period } : {}),
      topCount: topN,
    },
  };
}

type TrendGranularity = "day" | "week" | "month";

function resolveGranularity(
  requested: TrendGranularity | "auto" | undefined,
  from?: Date,
  to?: Date
): TrendGranularity {
  if (requested && requested !== "auto") return requested;
  if (from && to) {
    const spanDays = Math.max(
      1,
      Math.round((to.getTime() - from.getTime()) / 86_400_000)
    );
    if (spanDays <= 31) return "day";
    if (spanDays <= 180) return "week";
  }
  return "month";
}

function bucketKey(date: Date, granularity: TrendGranularity): string {
  const local = new Date(date);
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = local.getFullYear();
  const month = pad(local.getMonth() + 1);
  if (granularity === "month") return `${year}-${month}`;
  if (granularity === "week") {
    const mondayOffset = (local.getDay() + 6) % 7;
    const monday = new Date(local);
    monday.setDate(local.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
  }
  return `${year}-${month}-${pad(local.getDate())}`;
}

function periodDisplay(key: string, granularity: TrendGranularity): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(date);
  }
  if (granularity === "week") return `Week of ${formatDate(date)}`;
  return formatDate(date);
}

/**
 * Revenue trends: invoiced and collected revenue bucketed over time. Both the
 * invoiced (invoice date) and collected (payment date) series are bucketed by
 * the resolved granularity, so a bucket can contain collections for invoices
 * issued outside it; the outstanding column is the bucket's invoiced minus its
 * collected amounts.
 */
async function revenueTrendsReport(
  query: Extract<ReportQuery, { type: "revenue-trends" }>,
  page: number,
  pageSize: number
): Promise<ReportResult> {
  const dateWhere = dateFilter(query.from, query.to);
  const granularity = resolveGranularity(
    query.granularity,
    query.from,
    query.to
  );

  const invoiceWhere: Prisma.InvoiceWhereInput = {
    status: { in: [...ISSUED_STATUSES] },
  };
  if (dateWhere) invoiceWhere.invoiceDate = dateWhere;

  const paymentWhere: Prisma.PaymentWhereInput = {
    status: "COMPLETED",
    invoice: { status: { in: [...ISSUED_STATUSES] } },
  };
  if (dateWhere) paymentWhere.paidAt = dateWhere;

  const [invoices, payments] = await prisma.$transaction([
    prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        invoiceDate: true,
        totalAmount: true,
        totalCgst: true,
        totalSgst: true,
        totalIgst: true,
      },
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      select: { paidAt: true, amount: true },
    }),
  ]);

  const buckets = new Map<
    string,
    {
      periodKey: string;
      invoiceCount: number;
      invoiced: Prisma.Decimal;
      gst: Prisma.Decimal;
      collected: Prisma.Decimal;
    }
  >();

  for (const invoice of invoices) {
    const key = bucketKey(invoice.invoiceDate, granularity);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        periodKey: key,
        invoiceCount: 0,
        invoiced: ZERO(),
        gst: ZERO(),
        collected: ZERO(),
      };
      buckets.set(key, bucket);
    }
    bucket.invoiceCount += 1;
    bucket.invoiced = bucket.invoiced.plus(invoice.totalAmount);
    bucket.gst = bucket.gst
      .plus(invoice.totalCgst)
      .plus(invoice.totalSgst)
      .plus(invoice.totalIgst);
  }

  for (const payment of payments) {
    const key = bucketKey(payment.paidAt, granularity);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        periodKey: key,
        invoiceCount: 0,
        invoiced: ZERO(),
        gst: ZERO(),
        collected: ZERO(),
      };
      buckets.set(key, bucket);
    }
    bucket.collected = bucket.collected.plus(payment.amount);
  }

  const keys = [...buckets.keys()].sort();
  const rows: RevenueTrendRow[] = keys.map((key) => {
    const bucket = buckets.get(key)!;
    return {
      period: periodDisplay(key, granularity),
      periodKey: key,
      invoiceCount: bucket.invoiceCount,
      invoiced: bucket.invoiced.toString(),
      gst: bucket.gst.toString(),
      collected: bucket.collected.toString(),
      outstanding: bucket.invoiced.minus(bucket.collected).toString(),
    };
  });

  let invoiced = ZERO();
  let collected = ZERO();
  let gst = ZERO();
  let invoiceCount = 0;
  for (const row of rows) {
    invoiceCount += row.invoiceCount;
    invoiced = invoiced.plus(new Prisma.Decimal(row.invoiced));
    collected = collected.plus(new Prisma.Decimal(row.collected));
    gst = gst.plus(new Prisma.Decimal(row.gst));
  }

  const summary: ReportSummaryItem[] = [
    { label: "Invoices", value: formatNumber(invoiceCount) },
    { label: "Invoiced", value: formatMoney(invoiced.toString()) },
    { label: "GST", value: formatMoney(gst.toString()) },
    { label: "Collected", value: formatMoney(collected.toString()) },
    {
      label: "Outstanding",
      value: formatMoney(invoiced.minus(collected).toString()),
    },
  ];

  const period = periodLabel(query.from, query.to);

  return {
    ...paginate(rows, page, pageSize),
    summary,
    meta: {
      ...(period ? { period } : {}),
      granularity,
    },
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function runReport(
  query: ReportQuery,
  options: ReportOptions
): Promise<ReportResult> {
  switch (query.type) {
    case "sales":
      return salesReport(query, options.page, options.pageSize);
    case "payments":
      return paymentReport(query, options.page, options.pageSize);
    case "tax":
      return taxReport(query, options.page, options.pageSize);
    case "customers":
      return customerReport(query, options.page, options.pageSize);
    case "products":
      return productReport(query, options.page, options.pageSize);
    case "inventory":
      return inventoryReport(query, options.page, options.pageSize);
    case "outstanding":
      return outstandingReport(query, options.page, options.pageSize);
    case "top-products":
      return topProductsReport(query, options.page, options.pageSize);
    case "top-customers":
      return topCustomersReport(query, options.page, options.pageSize);
    case "revenue-trends":
      return revenueTrendsReport(query, options.page, options.pageSize);
  }
}
