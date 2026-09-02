import {
  Prisma,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { TransactionClient } from "@/lib/services/document-numbers";
import type { PaymentUpdatePayload } from "@/lib/validations/payment";

export type PaymentDetail = {
  id: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  note: string | null;
  paidAt: string;
  createdAt: string;
  user: { id: string; name: string };
};

export type PaymentListItem = {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customer: { id: string; name: string };
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paidAt: string;
  user: { id: string; name: string };
  createdAt: string;
};

export type PaymentListResult = {
  items: PaymentListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type PaymentListOptions = {
  search: string;
  method: PaymentMethod | null;
  status: PaymentStatus | null;
  page: number;
  pageSize: number;
};

const paymentInclude = {
  user: { select: { id: true, name: true } },
} satisfies Prisma.PaymentInclude;

const paymentListInclude = {
  invoice: {
    select: {
      invoiceNo: true,
      customer: { select: { id: true, name: true } },
    },
  },
  user: { select: { id: true, name: true } },
} satisfies Prisma.PaymentInclude;

type PaymentWithUser = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentListInclude;
}>;

export function toPaymentDetail(payment: PaymentWithUser): PaymentDetail {
  return {
    id: payment.id,
    amount: payment.amount.toString(),
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    note: payment.note,
    paidAt: payment.paidAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
    user: { id: payment.user.id, name: payment.user.name },
  };
}

function toListItem(payment: PaymentWithRelations): PaymentListItem {
  return {
    id: payment.id,
    invoiceId: payment.invoiceId,
    invoiceNo: payment.invoice.invoiceNo,
    customer: payment.invoice.customer,
    amount: payment.amount.toString(),
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    paidAt: payment.paidAt.toISOString(),
    user: payment.user,
    createdAt: payment.createdAt.toISOString(),
  };
}

/**
 * Sums the COMPLETED payments recorded against an invoice. Balances are always
 * derived from these rows and never stored, so refunded payments drop out of
 * the outstanding balance automatically.
 */
export async function computePaidAmount(
  tx: TransactionClient,
  invoiceId: string
): Promise<Prisma.Decimal> {
  const aggregation = await tx.payment.aggregate({
    where: { invoiceId, status: "COMPLETED" },
    _sum: { amount: true },
  });
  return aggregation._sum.amount ?? new Prisma.Decimal(0);
}

/**
 * Sums COMPLETED payments for a batch of invoices in a single grouped query.
 * Returns a map keyed by invoice id so callers can derive paid balances without
 * one query per invoice. Used by the invoice list and the reports module.
 */
export async function getPaidByInvoice(
  invoiceIds: string[]
): Promise<Map<string, Prisma.Decimal>> {
  const paidByInvoice = new Map<string, Prisma.Decimal>();
  if (invoiceIds.length === 0) return paidByInvoice;

  const rows = await prisma.payment.groupBy({
    by: ["invoiceId"],
    where: { invoiceId: { in: invoiceIds }, status: "COMPLETED" },
    _sum: { amount: true },
  });
  for (const row of rows) {
    paidByInvoice.set(row.invoiceId, row._sum.amount ?? new Prisma.Decimal(0));
  }
  return paidByInvoice;
}

/**
 * Maps a paid amount against the invoice total to the stored payment status:
 * PENDING when nothing is paid, PARTIALLY_PAID once a payment exists, and PAID
 * when the paid amount reaches the total.
 */
export function computeInvoicePaymentStatus(
  totalAmount: Prisma.Decimal,
  paidAmount: Prisma.Decimal
): "PENDING" | "PARTIALLY_PAID" | "PAID" {
  if (paidAmount.gte(totalAmount)) return "PAID";
  if (paidAmount.isZero()) return "PENDING";
  return "PARTIALLY_PAID";
}

/**
 * Recomputes an invoice's stored status from its COMPLETED payments after any
 * payment mutation (add, edit, delete, refund) and persists it.
 */
export async function recomputeInvoicePaymentStatus(
  tx: TransactionClient,
  invoiceId: string,
  totalAmount: Prisma.Decimal
): Promise<"PENDING" | "PARTIALLY_PAID" | "PAID"> {
  const paidAmount = await computePaidAmount(tx, invoiceId);
  const status = computeInvoicePaymentStatus(totalAmount, paidAmount);
  await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
  return status;
}

function buildWhere(options: PaymentListOptions): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};
  if (options.method) where.method = options.method;
  if (options.status) where.status = options.status;
  if (options.search) {
    where.AND = [
      {
        OR: [
          {
            invoice: {
              invoiceNo: { contains: options.search, mode: "insensitive" },
            },
          },
          {
            invoice: {
              customer: {
                name: { contains: options.search, mode: "insensitive" },
              },
            },
          },
          { reference: { contains: options.search, mode: "insensitive" } },
        ],
      },
    ];
  }
  return where;
}

async function findMany(
  options: PaymentListOptions,
  invoiceWhere: Prisma.InvoiceWhereInput
): Promise<PaymentListResult> {
  const { page, pageSize } = options;
  const where: Prisma.PaymentWhereInput = buildWhere(options);
  if (Object.keys(invoiceWhere).length > 0) {
    where.invoice = { ...invoiceWhere };
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: paymentListInclude,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items: payments.map(toListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/**
 * Paginated, filterable payment list across all invoices. Search matches the
 * invoice number, the customer name, and the payment reference.
 */
export async function listAllPayments(
  options: PaymentListOptions
): Promise<PaymentListResult> {
  return findMany(options, {});
}

/**
 * Paginated payment history scoped to a single customer's invoices.
 */
export async function listCustomerPayments(
  customerId: string,
  options: PaymentListOptions
): Promise<PaymentListResult> {
  return findMany(options, { customerId });
}

function assertPayableInvoice(status: InvoiceStatus): void {
  if (
    status !== "PENDING" &&
    status !== "PARTIALLY_PAID" &&
    status !== "PAID"
  ) {
    throw new DomainError(
      "CONFLICT",
      "Payments can only be modified against issued invoices.",
      409
    );
  }
}

const paymentInvoiceSelect = {
  id: true,
  invoiceNo: true,
  status: true,
  totalAmount: true,
} as const;

type PaymentInvoice = Prisma.InvoiceGetPayload<{
  select: typeof paymentInvoiceSelect;
}>;

/**
 * Loads a payment together with its invoice inside a transaction, enforcing the
 * shared mutation rules: the payment must belong to the invoice, the invoice
 * must be issued (not draft/cancelled/void), and the payment must be COMPLETED.
 */
async function loadPaymentWithInvoice(
  tx: TransactionClient,
  invoiceId: string,
  paymentId: string
): Promise<{ invoice: PaymentInvoice; payment: PaymentWithUser }> {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  if (!payment || payment.invoiceId !== invoiceId) {
    throw new DomainError("NOT_FOUND", "Payment not found.", 404);
  }

  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    select: paymentInvoiceSelect,
  });
  if (!invoice) {
    throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
  }

  assertPayableInvoice(invoice.status);

  if (payment.status !== "COMPLETED") {
    throw new DomainError(
      "CONFLICT",
      "Only completed payments can be modified.",
      409
    );
  }

  return { invoice, payment };
}

/**
 * Edits a completed payment. The other COMPLETED payments fix the outstanding
 * balance; raising the amount beyond it is rejected (PAYMENT_EXCEEDS_BALANCE).
 * The invoice status is recomputed and persisted from the new totals.
 */
export async function updatePayment(
  invoiceId: string,
  paymentId: string,
  input: PaymentUpdatePayload
): Promise<PaymentDetail> {
  return prisma.$transaction(async (tx) => {
    const { invoice, payment } = await loadPaymentWithInvoice(
      tx,
      invoiceId,
      paymentId
    );

    const otherPaid = (await computePaidAmount(tx, invoiceId)).minus(
      payment.amount
    );
    const balance = invoice.totalAmount.minus(otherPaid);
    const amount =
      input.amount !== undefined
        ? new Prisma.Decimal(input.amount)
        : payment.amount;

    if (amount.gt(balance)) {
      throw new DomainError(
        "PAYMENT_EXCEEDS_BALANCE",
        `This payment exceeds the outstanding balance of ${balance.toFixed(2)}.`,
        422,
        { outstanding: balance.toString() }
      );
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        amount,
        method: input.method ?? payment.method,
        reference:
          input.reference !== undefined
            ? (input.reference ?? null)
            : payment.reference,
        note: input.note !== undefined ? (input.note ?? null) : payment.note,
        paidAt: input.paidAt ?? payment.paidAt,
      },
      include: paymentInclude,
    });

    await recomputeInvoicePaymentStatus(tx, invoiceId, invoice.totalAmount);

    return toPaymentDetail(updated);
  });
}

/**
 * Permanently removes a completed payment row and recomputes the invoice
 * status from the remaining COMPLETED payments. Returns the removed payment
 * so callers can audit its amount and method.
 */
export async function deletePayment(
  invoiceId: string,
  paymentId: string
): Promise<PaymentDetail> {
  return prisma.$transaction(async (tx) => {
    const { invoice, payment } = await loadPaymentWithInvoice(
      tx,
      invoiceId,
      paymentId
    );
    const deleted = toPaymentDetail(payment);
    await tx.payment.delete({ where: { id: paymentId } });
    await recomputeInvoicePaymentStatus(tx, invoiceId, invoice.totalAmount);
    return deleted;
  });
}

/**
 * Flips a completed payment to REFUNDED. The row is kept for history but is
 * automatically excluded from the balance; the invoice status is recomputed.
 */
export async function refundPayment(
  invoiceId: string,
  paymentId: string
): Promise<PaymentDetail> {
  return prisma.$transaction(async (tx) => {
    const { invoice } = await loadPaymentWithInvoice(tx, invoiceId, paymentId);
    const refunded = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
      include: paymentInclude,
    });
    await recomputeInvoicePaymentStatus(tx, invoiceId, invoice.totalAmount);
    return toPaymentDetail(refunded);
  });
}
