import { Prisma, type QuotationStatus } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  nextInvoiceNumber,
  nextQuotationNumber,
} from "@/lib/services/document-numbers";
import type {
  QuotationCreatePayload,
  QuotationDuplicatePayload,
  QuotationUpdatePayload,
} from "@/lib/validations/quotation";

export type QuotationStatusOption =
  "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CONVERTED";

export type QuotationListItem = {
  id: string;
  quotationNo: string;
  customer: { id: string; name: string };
  date: string;
  validUntil: string | null;
  status: QuotationStatusOption;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type QuotationListResult = {
  items: QuotationListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type QuotationItemDetail = {
  id: string;
  productId: string | null;
  productName: string | null;
  hsn: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  cgstRate: string;
  cgstAmount: string;
  sgstRate: string;
  sgstAmount: string;
  igstRate: string;
  igstAmount: string;
  amount: string;
};

export type QuotationDetail = {
  id: string;
  quotationNo: string;
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
  date: string;
  validUntil: string | null;
  status: QuotationStatusOption;
  storedStatus: QuotationStatus;
  notes: string | null;
  subTotal: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalAmount: string;
  items: QuotationItemDetail[];
  createdAt: string;
  updatedAt: string;
};

const quotationInclude = {
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
} satisfies Prisma.QuotationInclude;

type QuotationWithRelations = Prisma.QuotationGetPayload<{
  include: typeof quotationInclude;
}>;

function resolveStatus(
  status: QuotationStatus,
  validUntil: Date | null,
  now: Date
): QuotationStatusOption {
  if (
    (status === "DRAFT" || status === "SENT") &&
    validUntil &&
    validUntil < now
  ) {
    return "EXPIRED";
  }
  return status;
}

function isIntraState(
  customerState: string | null,
  companyState: string | null
): boolean {
  if (!customerState || !companyState) return true;
  return (
    customerState.trim().toLowerCase() === companyState.trim().toLowerCase()
  );
}

function roundMoney(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Computes a quotation's totals and per-item tax amounts from the submitted
 * line items. GST is split into CGST + SGST (rate/2 each) for intra-state
 * customers and charged as IGST for inter-state customers. Totals are always
 * system-computed; the client never supplies money fields.
 */
function computeTotals(
  items: QuotationCreatePayload["items"],
  customerState: string | null,
  companyState: string | null
) {
  const intraState = isIntraState(customerState, companyState);

  const rows = items.map((item) => {
    const quantity = new Prisma.Decimal(item.quantity);
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const amount = roundMoney(quantity.times(unitPrice));
    const rate = new Prisma.Decimal(item.gstRate);

    const cgstRate = intraState ? rate.div(2) : new Prisma.Decimal(0);
    const sgstRate = intraState ? rate.div(2) : new Prisma.Decimal(0);
    const igstRate = intraState ? new Prisma.Decimal(0) : rate;

    return {
      productId: item.productId ?? null,
      description: item.description,
      quantity,
      unitPrice,
      cgstRate,
      cgstAmount: roundMoney(amount.times(cgstRate).div(100)),
      sgstRate,
      sgstAmount: roundMoney(amount.times(sgstRate).div(100)),
      igstRate,
      igstAmount: roundMoney(amount.times(igstRate).div(100)),
      amount,
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

  const totalAmount = subTotal.plus(totalCgst).plus(totalSgst).plus(totalIgst);

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

function toListItem(
  quotation: Prisma.QuotationGetPayload<{
    include: { customer: { select: { id: true; name: true } } };
  }>
): QuotationListItem {
  const now = new Date();
  return {
    id: quotation.id,
    quotationNo: quotation.quotationNo,
    customer: quotation.customer,
    date: quotation.date.toISOString(),
    validUntil: quotation.validUntil?.toISOString() ?? null,
    status: resolveStatus(quotation.status, quotation.validUntil, now),
    totalAmount: quotation.totalAmount.toString(),
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
  };
}

function toDetail(quotation: QuotationWithRelations): QuotationDetail {
  const now = new Date();
  return {
    id: quotation.id,
    quotationNo: quotation.quotationNo,
    customer: quotation.customer,
    date: quotation.date.toISOString(),
    validUntil: quotation.validUntil?.toISOString() ?? null,
    status: resolveStatus(quotation.status, quotation.validUntil, now),
    storedStatus: quotation.status,
    notes: quotation.notes,
    subTotal: quotation.subTotal.toString(),
    totalCgst: quotation.totalCgst.toString(),
    totalSgst: quotation.totalSgst.toString(),
    totalIgst: quotation.totalIgst.toString(),
    totalAmount: quotation.totalAmount.toString(),
    items: quotation.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? null,
      hsn: item.product?.hsn ?? null,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      cgstRate: item.cgstRate.toString(),
      cgstAmount: item.cgstAmount.toString(),
      sgstRate: item.sgstRate.toString(),
      sgstAmount: item.sgstAmount.toString(),
      igstRate: item.igstRate.toString(),
      igstAmount: item.igstAmount.toString(),
      amount: item.amount.toString(),
    })),
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
  };
}

async function getQuotationWithItems(
  id: string
): Promise<QuotationWithRelations> {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: quotationInclude,
  });
  if (!quotation) {
    throw new DomainError("NOT_FOUND", "Quotation not found.", 404);
  }
  return quotation;
}

export async function listQuotations(options: {
  search: string;
  status: QuotationStatusOption | null;
  page: number;
  pageSize: number;
}): Promise<QuotationListResult> {
  const { search, status, page, pageSize } = options;
  const now = new Date();
  const where: Prisma.QuotationWhereInput = {};

  if (search) {
    where.OR = [
      { quotationNo: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status === "EXPIRED") {
    where.status = { in: ["DRAFT", "SENT"] };
    where.validUntil = { lt: now };
  } else if (status === "DRAFT" || status === "SENT") {
    where.status = status;
    where.OR = [{ validUntil: null }, { validUntil: { gte: now } }];
  } else if (status) {
    where.status = status;
  }

  const [quotations, total] = await prisma.$transaction([
    prisma.quotation.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.quotation.count({ where }),
  ]);

  return {
    items: quotations.map(toListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getQuotation(id: string): Promise<QuotationDetail> {
  return toDetail(await getQuotationWithItems(id));
}

export async function createQuotation(
  input: QuotationCreatePayload,
  userId: string
): Promise<QuotationDetail> {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: input.customerId },
      select: { state: true },
    });
    if (!customer) {
      throw new DomainError("NOT_FOUND", "Customer not found.", 404);
    }

    const settings = await tx.companySettings.findUnique({
      where: { id: "default" },
      select: { state: true },
    });
    const companyState = settings?.state ?? null;

    const { rows, totals } = computeTotals(
      input.items,
      customer.state,
      companyState
    );
    const quotationNo = await nextQuotationNumber(tx);

    const quotation = await tx.quotation.create({
      data: {
        quotationNo,
        customerId: input.customerId,
        date: input.date,
        validUntil: input.validUntil ?? null,
        status: input.status,
        notes: input.notes ?? null,
        ...totals,
        items: { create: rows },
      },
      include: quotationInclude,
    });

    return toDetail(quotation);
  });
}

export async function updateQuotation(
  id: string,
  input: QuotationUpdatePayload
): Promise<QuotationDetail> {
  const existing = await getQuotationWithItems(id);
  if (existing.status === "CONVERTED") {
    throw new DomainError(
      "CONFLICT",
      "Converted quotations cannot be edited.",
      409
    );
  }

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

    const settings = await tx.companySettings.findUnique({
      where: { id: "default" },
      select: { state: true },
    });
    const companyState = settings?.state ?? null;

    const data: Prisma.QuotationUncheckedUpdateInput = {};
    if (input.customerId !== undefined) data.customerId = input.customerId;
    if (input.date !== undefined) data.date = input.date;
    if (input.validUntil !== undefined) {
      data.validUntil = input.validUntil ?? null;
    }
    if (input.status !== undefined) data.status = input.status;
    if (input.notes !== undefined) data.notes = input.notes ?? null;

    if (input.items) {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      const { rows, totals } = computeTotals(
        input.items,
        customer?.state ?? existing.customer.state,
        companyState
      );
      data.items = { create: rows };
      Object.assign(data, totals);
    }

    const quotation = await tx.quotation.update({
      where: { id },
      data,
      include: quotationInclude,
    });

    return toDetail(quotation);
  });
}

export async function deleteQuotation(id: string): Promise<void> {
  const existing = await getQuotationWithItems(id);
  if (existing.status === "CONVERTED") {
    throw new DomainError(
      "CONFLICT",
      "Converted quotations cannot be deleted.",
      409
    );
  }
  await prisma.quotation.delete({ where: { id } });
}

export async function duplicateQuotation(
  id: string,
  input: QuotationDuplicatePayload
): Promise<QuotationDetail> {
  const source = await getQuotationWithItems(id);

  return prisma.$transaction(async (tx) => {
    const quotationNo = await nextQuotationNumber(tx);
    const quotation = await tx.quotation.create({
      data: {
        quotationNo,
        customerId: source.customerId,
        date: new Date(),
        validUntil: source.validUntil,
        status: input.status,
        notes: source.notes,
        subTotal: source.subTotal,
        totalCgst: source.totalCgst,
        totalSgst: source.totalSgst,
        totalIgst: source.totalIgst,
        totalAmount: source.totalAmount,
        items: {
          create: source.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
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
      include: quotationInclude,
    });

    return toDetail(quotation);
  });
}

export type ConvertQuotationResult = {
  invoiceId: string;
  invoiceNo: string;
  quotationId: string;
};

/**
 * Converts a quotation into a DRAFT invoice, copying the customer, line
 * items, and totals. Inventory is intentionally untouched here — stock is
 * only deducted when the invoice is finalized. Only DRAFT, SENT, and ACCEPTED
 * quotations can be converted; EXPIRED, REJECTED, and already-CONVERTED
 * quotations are rejected.
 */
export async function convertQuotation(
  id: string,
  input: {
    orderNo?: string;
    orderDate?: Date | null;
    dcNo?: string;
    dcDate?: Date | null;
  },
  userId: string
): Promise<ConvertQuotationResult> {
  const source = await getQuotationWithItems(id);
  const now = new Date();
  const status = resolveStatus(source.status, source.validUntil, now);

  if (status === "CONVERTED") {
    throw new DomainError(
      "CONFLICT",
      "This quotation has already been converted into an invoice.",
      409
    );
  }
  if (status === "EXPIRED") {
    throw new DomainError(
      "EXPIRED",
      "Expired quotations cannot be converted into invoices.",
      409
    );
  }
  if (status === "REJECTED") {
    throw new DomainError(
      "REJECTED",
      "Rejected quotations cannot be converted into invoices.",
      409
    );
  }

  return prisma.$transaction(async (tx) => {
    const invoiceNo = await nextInvoiceNumber(tx);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNo,
        customerId: source.customerId,
        userId,
        status: "DRAFT",
        invoiceDate: now,
        dueDate: now,
        orderNo: input.orderNo ?? null,
        orderDate: input.orderDate ?? null,
        dcNo: input.dcNo ?? null,
        dcDate: input.dcDate ?? null,
        subTotal: source.subTotal,
        totalCgst: source.totalCgst,
        totalSgst: source.totalSgst,
        totalIgst: source.totalIgst,
        extraCharges: new Prisma.Decimal(0),
        totalAmount: source.totalAmount,
        notes: source.notes,
        items: {
          create: source.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            hsn: item.product?.hsn ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
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
    });

    await tx.quotation.update({
      where: { id },
      data: { status: "CONVERTED" },
    });

    return {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      quotationId: id,
    };
  });
}
