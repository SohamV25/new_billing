import { Prisma, type InvoiceStatus } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { amountInWords } from "@/lib/number-to-words";
import { prisma } from "@/lib/prisma";
import {
  nextInvoiceNumber,
  type TransactionClient,
} from "@/lib/services/document-numbers";
import {
  computePaidAmount,
  getPaidByInvoice,
  recomputeInvoicePaymentStatus,
  toPaymentDetail,
  type PaymentDetail,
} from "@/lib/services/payments";
import type {
  InvoiceCreatePayload,
  InvoiceUpdatePayload,
} from "@/lib/validations/invoice";
import type { PaymentCreatePayload } from "@/lib/validations/payment";

export type InvoiceStatusOption =
  | "DRAFT"
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "VOID";

export type InvoiceListItem = {
  id: string;
  invoiceNo: string;
  customer: { id: string; name: string };
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceListResult = {
  items: InvoiceListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type InvoiceItemDetail = {
  id: string;
  productId: string | null;
  productName: string | null;
  hsn: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  amount: string;
};

export type InvoiceDetail = {
  id: string;
  invoiceNo: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    gstin: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  };
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  extraCharges: string;
  extraReason: string | null;
  amountInWords: string;
  orderNo: string | null;
  orderDate: string | null;
  dcNo: string | null;
  dcDate: string | null;
  subTotal: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  cancelledAt: string | null;
  items: InvoiceItemDetail[];
  createdAt: string;
  updatedAt: string;
};

const invoiceInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      gstin: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
    },
  },
  items: {
    include: { product: { select: { name: true, hsn: true } } },
    orderBy: { id: "asc" as const },
  },
  payments: {
    where: { status: "COMPLETED" as const },
    select: { amount: true },
  },
} satisfies Prisma.InvoiceInclude;

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

function roundMoney(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Computes an invoice's totals and per-item tax amounts from the submitted
 * line items. Each item supplies separate CGST, SGST, and IGST rates.
 * Per-item discount reduces the taxable amount before GST is applied.
 * Totals are always system-computed; the client never supplies money fields.
 */
function computeTotals(
  items: InvoiceCreatePayload["items"],
  extraCharges: Prisma.Decimal
) {
  const rows = items.map((item) => {
    const quantity = new Prisma.Decimal(item.quantity);
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const discount = new Prisma.Decimal(item.discount ?? 0);
    const taxableAmount = roundMoney(quantity.times(unitPrice).minus(discount));
    const cgstRate = new Prisma.Decimal(item.cgstRate ?? 0);
    const sgstRate = new Prisma.Decimal(item.sgstRate ?? 0);
    const igstRate = new Prisma.Decimal(item.igstRate ?? 0);

    return {
      productId: item.productId ?? null,
      description: item.description,
      quantity,
      unitPrice,
      discount,
      cgstRate,
      cgstAmount: roundMoney(taxableAmount.times(cgstRate).div(100)),
      sgstRate,
      sgstAmount: roundMoney(taxableAmount.times(sgstRate).div(100)),
      igstRate,
      igstAmount: roundMoney(taxableAmount.times(igstRate).div(100)),
      amount: taxableAmount,
    };
  });

  let subTotal = new Prisma.Decimal(0);
  let totalCgst = new Prisma.Decimal(0);
  let totalSgst = new Prisma.Decimal(0);
  let totalIgst = new Prisma.Decimal(0);

  for (const row of rows) {
    subTotal = subTotal.plus(row.amount);
    totalCgst = totalCgst.plus(row.cgstAmount);
    totalSgst = totalSgst.plus(row.sgstAmount);
    totalIgst = totalIgst.plus(row.igstAmount);
  }

  const totalAmount = subTotal
    .plus(totalCgst)
    .plus(totalSgst)
    .plus(totalIgst)
    .plus(extraCharges);

  return {
    rows,
    totals: {
      subTotal: roundMoney(subTotal),
      totalCgst: roundMoney(totalCgst),
      totalSgst: roundMoney(totalSgst),
      totalIgst: roundMoney(totalIgst),
      totalAmount: roundMoney(totalAmount),
    },
  };
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Computes the status reported to callers. OVERDUE is never stored: a PENDING
 * or PARTIALLY_PAID invoice whose due date has passed is reported as OVERDUE
 * on read, mirroring how quotations compute EXPIRED.
 */
function resolveStatus(
  status: InvoiceStatus,
  dueDate: Date | null,
  now: Date
): InvoiceStatus {
  if (
    (status === "PENDING" || status === "PARTIALLY_PAID") &&
    dueDate &&
    // Due dates are date-only, so an invoice is not overdue on its due date —
    // only once that whole day has passed. Without this every invoice issued
    // today reads OVERDUE the moment it is created.
    dueDate < startOfDay(now)
  ) {
    return "OVERDUE";
  }
  return status;
}

function sumAmounts(payments: { amount: Prisma.Decimal }[]): Prisma.Decimal {
  return payments.reduce(
    (sum, payment) => sum.plus(payment.amount),
    new Prisma.Decimal(0)
  );
}

function toListItem(
  invoice: Prisma.InvoiceGetPayload<{
    include: { customer: { select: { id: true; name: true } } };
  }>,
  paidAmount: Prisma.Decimal
): InvoiceListItem {
  const now = new Date();
  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    customer: invoice.customer,
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    status: resolveStatus(invoice.status, invoice.dueDate, now),
    totalAmount: invoice.totalAmount.toString(),
    paidAmount: paidAmount.toString(),
    balance: invoice.totalAmount.minus(paidAmount).toString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

function toDetail(invoice: InvoiceWithRelations): InvoiceDetail {
  const now = new Date();
  const paidAmount = sumAmounts(invoice.payments);
  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    customer: invoice.customer,
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    status: resolveStatus(invoice.status, invoice.dueDate, now),
    notes: invoice.notes,
    terms: invoice.terms,
    extraCharges: invoice.extraCharges.toString(),
    extraReason: invoice.extraReason,
    amountInWords:
      invoice.amountInWords ?? amountInWords(invoice.totalAmount.toString()),
    orderNo: invoice.orderNo,
    orderDate: invoice.orderDate?.toISOString() ?? null,
    dcNo: invoice.dcNo,
    dcDate: invoice.dcDate?.toISOString() ?? null,
    subTotal: invoice.subTotal.toString(),
    totalCgst: invoice.totalCgst.toString(),
    totalSgst: invoice.totalSgst.toString(),
    totalIgst: invoice.totalIgst.toString(),
    totalAmount: invoice.totalAmount.toString(),
    paidAmount: paidAmount.toString(),
    balance: invoice.totalAmount.minus(paidAmount).toString(),
    cancelledAt: invoice.cancelledAt?.toISOString() ?? null,
    items: invoice.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? null,
      hsn: item.product?.hsn ?? null,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discount: item.discount.toString(),
      cgstRate: item.cgstRate.toString(),
      cgstAmount: item.cgstAmount.toString(),
      sgstRate: item.sgstRate.toString(),
      sgstAmount: item.sgstAmount.toString(),
      igstRate: item.igstRate.toString(),
      igstAmount: item.igstAmount.toString(),
      amount: item.amount.toString(),
    })),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

async function getInvoiceWithItems(id: string): Promise<InvoiceWithRelations> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: invoiceInclude,
  });
  if (!invoice) {
    throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
  }
  return invoice;
}

/**
 * Invoices are issued as soon as they are created, so "draft only" would make
 * them permanently uneditable. An invoice stays editable while it is issued and
 * nothing has been collected against it; once money has been received the items
 * are immutable (see docs/business-rules.md), and cancelled/void invoices are
 * closed.
 */
async function assertEditable(
  invoiceId: string,
  status: InvoiceStatus
): Promise<void> {
  if (status !== "DRAFT" && status !== "PENDING") {
    throw new DomainError(
      "CONFLICT",
      status === "CANCELLED" || status === "VOID"
        ? "Cancelled invoices cannot be edited."
        : "Invoices with recorded payments cannot be edited.",
      409
    );
  }

  const completedPayments = await prisma.payment.count({
    where: { invoiceId, status: "COMPLETED" },
  });
  if (completedPayments > 0) {
    throw new DomainError(
      "CONFLICT",
      "Invoices with recorded payments cannot be edited.",
      409
    );
  }
}

function assertDraft(status: InvoiceStatus): void {
  if (status !== "DRAFT") {
    throw new DomainError(
      "CONFLICT",
      "Only draft invoices can be edited or deleted.",
      409
    );
  }
}

export async function listInvoices(options: {
  search: string;
  status: InvoiceStatusOption | null;
  page: number;
  pageSize: number;
}): Promise<InvoiceListResult> {
  const { search, status, page, pageSize } = options;
  const now = new Date();

  const statusWhere: Prisma.InvoiceWhereInput[] = [];
  if (status === "OVERDUE") {
    statusWhere.push(
      { status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      { dueDate: { lt: now } }
    );
  } else if (status === "PENDING" || status === "PARTIALLY_PAID") {
    statusWhere.push(
      { status },
      { OR: [{ dueDate: null }, { dueDate: { gte: now } }] }
    );
  } else if (status) {
    statusWhere.push({ status });
  }

  const where: Prisma.InvoiceWhereInput = { AND: statusWhere };
  if (search) {
    where.AND = [
      ...statusWhere,
      {
        OR: [
          { invoiceNo: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      },
    ];
  }

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      // Newest first. invoiceDate can carry a time component and can be
      // back-dated, so creation order is what actually matches the invoice
      // number sequence the user sees.
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  const paidByInvoice = await getPaidByInvoice(invoices.map((item) => item.id));

  return {
    items: invoices.map((invoice) =>
      toListItem(
        invoice,
        paidByInvoice.get(invoice.id) ?? new Prisma.Decimal(0)
      )
    ),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  return toDetail(await getInvoiceWithItems(id));
}

/**
 * Creates a draft invoice. Invoices always start in DRAFT; stock is only
 * deducted when the draft is finalized. The due date defaults to the invoice
 * date when not supplied.
 */
export async function createInvoice(
  input: InvoiceCreatePayload,
  userId: string
): Promise<InvoiceDetail> {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: input.customerId },
      select: { state: true },
    });
    if (!customer) {
      throw new DomainError("NOT_FOUND", "Customer not found.", 404);
    }

    const extraCharges = new Prisma.Decimal(input.extraCharges ?? 0);
    const { rows, totals } = computeTotals(input.items, extraCharges);
    const invoiceNo = await nextInvoiceNumber(tx);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        customerId: input.customerId,
        userId,
        status: "DRAFT",
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate ?? input.invoiceDate,
        orderNo: input.orderNo ?? null,
        orderDate: input.orderDate ?? null,
        dcNo: input.dcNo ?? null,
        dcDate: input.dcDate ?? null,
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        extraCharges,
        extraReason: input.extraReason ?? null,
        amountInWords: amountInWords(totals.totalAmount.toString()),
        ...totals,
        items: {
          create: rows.map((row) => ({
            productId: row.productId,
            description: row.description,
            hsn: null,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            discount: row.discount,
            cgstRate: row.cgstRate,
            cgstAmount: row.cgstAmount,
            sgstRate: row.sgstRate,
            sgstAmount: row.sgstAmount,
            igstRate: row.igstRate,
            igstAmount: row.igstAmount,
            amount: row.amount,
          })),
        },
      },
      include: invoiceInclude,
    });

    return toDetail(invoice);
  });
}

export async function updateInvoice(
  id: string,
  input: InvoiceUpdatePayload,
  userId: string
): Promise<InvoiceDetail> {
  const existing = await getInvoiceWithItems(id);
  await assertEditable(id, existing.status);
  const wasIssued = existing.status !== "DRAFT";

  return prisma.$transaction(async (tx) => {
    const customer = input.customerId
      ? await tx.customer.findUnique({
          where: { id: input.customerId },
          select: { state: true },
        })
      : null;
    if (input.customerId && !customer) {
      throw new DomainError("NOT_FOUND", "Customer not found.", 404);
    }

    const data: Prisma.InvoiceUncheckedUpdateInput = {};
    if (input.customerId !== undefined) data.customerId = input.customerId;
    if (input.invoiceDate !== undefined) data.invoiceDate = input.invoiceDate;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate ?? null;
    if (input.orderNo !== undefined) data.orderNo = input.orderNo ?? null;
    if (input.orderDate !== undefined) data.orderDate = input.orderDate ?? null;
    if (input.dcNo !== undefined) data.dcNo = input.dcNo ?? null;
    if (input.dcDate !== undefined) data.dcDate = input.dcDate ?? null;
    if (input.notes !== undefined) data.notes = input.notes ?? null;
    if (input.terms !== undefined) data.terms = input.terms ?? null;
    if (input.extraReason !== undefined) {
      data.extraReason = input.extraReason ?? null;
    }

    const newExtra =
      input.extraCharges !== undefined
        ? new Prisma.Decimal(input.extraCharges)
        : existing.extraCharges;
    if (input.extraCharges !== undefined) data.extraCharges = newExtra;

    let subTotal = existing.subTotal;
    let totalCgst = existing.totalCgst;
    let totalSgst = existing.totalSgst;
    let totalIgst = existing.totalIgst;

    if (input.items) {
      // An issued invoice has already moved stock, so give the old quantities
      // back before the items are replaced; the new ones are deducted below.
      if (wasIssued) {
        await restoreInvoiceStock(tx, existing, userId);
      }
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      const { rows, totals } = computeTotals(input.items, newExtra);
      subTotal = totals.subTotal;
      totalCgst = totals.totalCgst;
      totalSgst = totals.totalSgst;
      totalIgst = totals.totalIgst;
      data.items = {
        create: rows.map((row) => ({
          productId: row.productId,
          description: row.description,
          hsn: null,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          discount: row.discount,
          cgstRate: row.cgstRate,
          cgstAmount: row.cgstAmount,
          sgstRate: row.sgstRate,
          sgstAmount: row.sgstAmount,
          igstRate: row.igstRate,
          igstAmount: row.igstAmount,
          amount: row.amount,
        })),
      };
      data.subTotal = subTotal;
      data.totalCgst = totalCgst;
      data.totalSgst = totalSgst;
      data.totalIgst = totalIgst;
    }

    const totalAmount = roundMoney(
      subTotal.plus(totalCgst).plus(totalSgst).plus(totalIgst).plus(newExtra)
    );
    data.totalAmount = totalAmount;
    data.amountInWords = amountInWords(totalAmount.toString());

    const invoice = await tx.invoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });

    // Take stock for the replacement items. Any shortage throws here and rolls
    // the whole edit back, so stock and the invoice can never disagree.
    if (input.items && wasIssued) {
      await deductInvoiceStock(tx, invoice, userId);
    }

    return toDetail(invoice);
  });
}

/**
 * Hard-deletes a draft invoice and its line items. Only draft invoices can be
 * deleted; issued, paid, overdue, cancelled, and voided invoices are locked.
 */
export async function deleteInvoice(id: string): Promise<void> {
  const existing = await getInvoiceWithItems(id);
  assertDraft(existing.status);
  await prisma.invoice.delete({ where: { id } });
}

export type StockShortage = {
  productId: string;
  name: string;
  required: number;
  available: number;
};

/**
 * Deducts stock for an invoice's product-linked line items and records an OUT
 * StockMovement for each, keyed by the invoice number. Only whole-number
 * quantities can be deducted. The decrement uses an atomic `quantity >= n`
 * guard so concurrent finalization can never drive stock negative or
 * oversell.
 */
async function deductInvoiceStock(
  tx: TransactionClient,
  invoice: InvoiceWithRelations,
  userId: string
): Promise<void> {
  const productItems = invoice.items.filter(
    (item): item is typeof item & { productId: string } =>
      item.productId !== null
  );
  if (productItems.length === 0) return;

  for (const item of productItems) {
    if (!item.quantity.isInteger()) {
      throw new DomainError(
        "FRACTIONAL_STOCK",
        `"${item.description}" uses a fractional quantity and cannot be deducted from stock.`,
        422
      );
    }
  }

  const productIds = [...new Set(productItems.map((item) => item.productId))];
  const inventoryRows = await tx.inventory.findMany({
    where: { productId: { in: productIds } },
    include: { product: { select: { name: true } } },
  });
  const inventoryByProduct = new Map(
    inventoryRows.map((row) => [row.productId, row])
  );

  const shortages: StockShortage[] = [];
  for (const item of productItems) {
    const required = item.quantity.toNumber();
    const row = inventoryByProduct.get(item.productId);
    const available = row?.quantity ?? 0;
    if (available < required) {
      shortages.push({
        productId: item.productId,
        name: row?.product.name ?? item.description,
        required,
        available,
      });
    }
  }
  if (shortages.length > 0) {
    throw new DomainError(
      "INSUFFICIENT_STOCK",
      "Not enough stock to finalize this invoice.",
      422,
      { shortages }
    );
  }

  for (const item of productItems) {
    const quantity = item.quantity.toNumber();
    const result = await tx.inventory.updateMany({
      where: { productId: item.productId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    if (result.count === 0) {
      throw new DomainError(
        "INSUFFICIENT_STOCK",
        "Not enough stock to finalize this invoice.",
        422
      );
    }
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: "OUT",
        quantity,
        reason: `Issued on invoice ${invoice.invoiceNo}`,
        reference: invoice.invoiceNo,
        userId,
      },
    });
  }
}

/**
 * Restores stock for an invoice's product-linked line items and records an IN
 * StockMovement for each. Used when an issued invoice is cancelled.
 */
async function restoreInvoiceStock(
  tx: TransactionClient,
  invoice: InvoiceWithRelations,
  userId: string
): Promise<void> {
  const productItems = invoice.items.filter(
    (item): item is typeof item & { productId: string } =>
      item.productId !== null
  );

  for (const item of productItems) {
    const quantity = item.quantity.toNumber();
    await tx.inventory.upsert({
      where: { productId: item.productId },
      update: { quantity: { increment: quantity } },
      create: { productId: item.productId, quantity, lowStockAt: 5 },
    });
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: "IN",
        quantity,
        reason: `Invoice ${invoice.invoiceNo} cancelled`,
        reference: invoice.invoiceNo,
        userId,
      },
    });
  }
}

/**
 * Finalizes a draft invoice: re-validates the customer and stock availability,
 * deducts inventory, and moves the invoice to PENDING. Once issued, the line
 * items are immutable.
 */
export async function finalizeInvoice(
  id: string,
  userId: string
): Promise<InvoiceDetail> {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    if (!invoice) {
      throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
    }
    if (invoice.status !== "DRAFT") {
      throw new DomainError(
        "CONFLICT",
        "Only draft invoices can be finalized.",
        409
      );
    }

    const customer = await tx.customer.findUnique({
      where: { id: invoice.customerId },
    });
    if (!customer || customer.deletedAt) {
      throw new DomainError(
        "CONFLICT",
        "This customer is no longer active.",
        409
      );
    }

    await deductInvoiceStock(tx, invoice, userId);

    const updated = await tx.invoice.update({
      where: { id },
      data: { status: "PENDING" },
      include: invoiceInclude,
    });
    return toDetail(updated);
  });
}

/**
 * Cancels an issued invoice that has no completed payments, restoring the
 * deducted stock and stamping the cancellation timestamp. Paid, partially
 * paid, and already-cancelled/voided invoices are rejected.
 */
export async function cancelInvoice(
  id: string,
  userId: string
): Promise<InvoiceDetail> {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    if (!invoice) {
      throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
    }
    if (invoice.status !== "PENDING" && invoice.status !== "PARTIALLY_PAID") {
      throw new DomainError(
        "CONFLICT",
        "Only issued invoices with no payments can be cancelled.",
        409
      );
    }

    const completedPayments = await tx.payment.count({
      where: { invoiceId: id, status: "COMPLETED" },
    });
    if (completedPayments > 0) {
      throw new DomainError(
        "CONFLICT",
        "Invoices with recorded payments cannot be cancelled.",
        409
      );
    }

    await restoreInvoiceStock(tx, invoice, userId);

    const updated = await tx.invoice.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: invoiceInclude,
    });
    return toDetail(updated);
  });
}

/**
 * Records a completed payment against an issued invoice. The outstanding
 * balance is always derived from COMPLETED payments (never stored); the
 * invoice's stored status is advanced to PARTIALLY_PAID or PAID accordingly.
 */
export async function addPayment(
  id: string,
  input: PaymentCreatePayload,
  userId: string
): Promise<PaymentDetail> {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id },
      select: { id: true, invoiceNo: true, status: true, totalAmount: true },
    });
    if (!invoice) {
      throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
    }
    if (
      invoice.status !== "PENDING" &&
      invoice.status !== "PARTIALLY_PAID" &&
      invoice.status !== "PAID"
    ) {
      throw new DomainError(
        "CONFLICT",
        "Payments can only be recorded against issued invoices.",
        409
      );
    }

    const paid = await computePaidAmount(tx, id);
    const balance = invoice.totalAmount.minus(paid);
    const amount = new Prisma.Decimal(input.amount);

    if (amount.gt(balance)) {
      throw new DomainError(
        "PAYMENT_EXCEEDS_BALANCE",
        `This payment exceeds the outstanding balance of ${balance.toFixed(2)}.`,
        422,
        { outstanding: balance.toString() }
      );
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId: id,
        userId,
        amount,
        method: input.method,
        reference: input.reference ?? null,
        note: input.note ?? null,
        paidAt: input.paidAt ?? new Date(),
        status: "COMPLETED",
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await recomputeInvoicePaymentStatus(tx, id, invoice.totalAmount);

    return toPaymentDetail(payment);
  });
}

export async function listPayments(
  invoiceId: string
): Promise<PaymentDetail[]> {
  const payments = await prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paidAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return payments.map(toPaymentDetail);
}

export type TimelineEntry = {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  metadata: Record<string, unknown> | null;
};

/**
 * Lists the activity timeline for an invoice, built from existing audit log
 * rows keyed by entityType "Invoice" and the invoice id.
 */
export async function listInvoiceTimeline(
  invoiceId: string
): Promise<TimelineEntry[]> {
  const entries = await prisma.auditLog.findMany({
    where: { entityType: "Invoice", entityId: invoiceId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, name: true } } },
  });

  return entries.map((entry) => ({
    id: entry.id,
    action: entry.action,
    createdAt: entry.createdAt.toISOString(),
    user: entry.user,
    metadata: entry.metadata as Record<string, unknown> | null,
  }));
}

/**
 * Duplicates an existing invoice as a new DRAFT with the same customer, dates,
 * line items, and totals. The copy receives a fresh invoice number and a new
 * amount-in-words rendering of its total.
 */
export async function duplicateInvoice(
  id: string,
  userId: string
): Promise<InvoiceDetail> {
  const source = await getInvoiceWithItems(id);

  return prisma.$transaction(async (tx) => {
    const invoiceNo = await nextInvoiceNumber(tx);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        customerId: source.customerId,
        userId,
        status: "DRAFT",
        invoiceDate: source.invoiceDate,
        dueDate: source.dueDate,
        orderNo: source.orderNo,
        orderDate: source.orderDate,
        dcNo: source.dcNo,
        dcDate: source.dcDate,
        notes: source.notes,
        terms: source.terms,
        extraCharges: source.extraCharges,
        extraReason: source.extraReason,
        amountInWords: amountInWords(source.totalAmount.toString()),
        subTotal: source.subTotal,
        totalCgst: source.totalCgst,
        totalSgst: source.totalSgst,
        totalIgst: source.totalIgst,
        totalAmount: source.totalAmount,
        items: {
          create: source.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            hsn: item.product?.hsn ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            cgstRate: item.cgstRate,
            cgstAmount: item.cgstAmount,
            sgstRate: item.sgstRate,
            sgstAmount: item.sgstAmount,
            igstRate: item.igstRate,
            igstAmount: item.igstAmount,
            amount: item.amount,
          })),
        },
      },
      include: invoiceInclude,
    });

    return toDetail(invoice);
  });
}
