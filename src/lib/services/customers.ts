import { Prisma, type Customer } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type {
  CustomerCreatePayload,
  CustomerUpdatePayload,
} from "@/lib/validations/customer";

export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  invoiceCount: number;
  quotationCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerFilters = {
  cities: string[];
  states: string[];
};

export type CustomerListResult = {
  items: CustomerListItem[];
  filters: CustomerFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CustomerDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  invoiceCount: number;
  quotationCount: number;
  createdAt: string;
  updatedAt: string;
};

type CustomerWithCounts = Customer & {
  _count: { invoices: number; quotations: number };
};

function buildWhere(options: {
  search: string;
  city?: string;
  state?: string;
}): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
      { phone: { contains: options.search, mode: "insensitive" } },
      { city: { contains: options.search, mode: "insensitive" } },
      { gstin: { contains: options.search, mode: "insensitive" } },
    ];
  }
  if (options.city) {
    where.city = { equals: options.city, mode: "insensitive" };
  }
  if (options.state) {
    where.state = { equals: options.state, mode: "insensitive" };
  }
  return where;
}

function toListItem(customer: CustomerWithCounts): CustomerListItem {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    gstin: customer.gstin,
    invoiceCount: customer._count.invoices,
    quotationCount: customer._count.quotations,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export async function listCustomers(options: {
  search: string;
  city?: string;
  state?: string;
  page: number;
  pageSize: number;
}): Promise<CustomerListResult> {
  const { search, city, state, page, pageSize } = options;
  const where = buildWhere({ search, city, state });

  const [customers, total, cityRows, stateRows] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { invoices: true, quotations: true } },
      },
    }),
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where: { deletedAt: null, city: { not: null } },
      distinct: ["city"],
      select: { city: true },
    }),
    prisma.customer.findMany({
      where: { deletedAt: null, state: { not: null } },
      distinct: ["state"],
      select: { state: true },
    }),
  ]);

  const filters: CustomerFilters = {
    cities: cityRows
      .map((row) => row.city)
      .filter((value): value is string => value !== null)
      .sort((a, b) => a.localeCompare(b)),
    states: stateRows
      .map((row) => row.state)
      .filter((value): value is string => value !== null)
      .sort((a, b) => a.localeCompare(b)),
  };

  return {
    items: customers.map(toListItem),
    filters,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const customer = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { invoices: true, quotations: true } },
    },
  });
  if (!customer) {
    throw new DomainError("NOT_FOUND", "Customer not found.", 404);
  }

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    gstin: customer.gstin,
    invoiceCount: customer._count.invoices,
    quotationCount: customer._count.quotations,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export async function createCustomer(
  input: CustomerCreatePayload
): Promise<CustomerDetail> {
  const customer = await prisma.customer.create({ data: input });
  return getCustomer(customer.id);
}

export async function updateCustomer(
  id: string,
  input: CustomerUpdatePayload
): Promise<CustomerDetail> {
  await getCustomer(id);

  const data: Prisma.CustomerUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.address !== undefined) data.address = input.address;
  if (input.city !== undefined) data.city = input.city;
  if (input.state !== undefined) data.state = input.state;
  if (input.pincode !== undefined) data.pincode = input.pincode;
  if (input.gstin !== undefined) data.gstin = input.gstin;

  await prisma.customer.update({ where: { id }, data });
  return getCustomer(id);
}

/**
 * Soft-deletes a customer. The row is kept so existing invoices and quotations
 * keep their references; it is simply hidden from active customer lists.
 */
export async function deleteCustomer(id: string): Promise<Customer> {
  await getCustomer(id);
  return prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
