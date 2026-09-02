import {
  Prisma,
  type Inventory,
  type Product,
} from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type {
  ProductCreatePayload,
  ProductUpdatePayload,
} from "@/lib/validations/product";

export type ProductListItem = {
  id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  hsn: string | null;
  unit: string | null;
  price: string;
  gstRate: string;
  inventory: { quantity: number; lowStockAt: number } | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResult = {
  items: ProductListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type ProductWithRelations = Product & {
  inventory: Pick<Inventory, "quantity" | "lowStockAt"> | null;
};

function buildWhere(options: { search: string }): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { barcode: { contains: options.search, mode: "insensitive" } },
      { sku: { contains: options.search, mode: "insensitive" } },
      { hsn: { contains: options.search, mode: "insensitive" } },
    ];
  }
  return where;
}

function toListItem(product: ProductWithRelations): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    sku: product.sku,
    hsn: product.hsn,
    unit: product.unit,
    price: product.price.toString(),
    gstRate: product.gstRate.toString(),
    inventory: product.inventory
      ? {
          quantity: product.inventory.quantity,
          lowStockAt: product.inventory.lowStockAt,
        }
      : null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

const productInclude = {
  inventory: { select: { quantity: true, lowStockAt: true } },
} satisfies Prisma.ProductInclude;

export async function listProducts(options: {
  search: string;
  page: number;
  pageSize: number;
}): Promise<ProductListResult> {
  const { search, page, pageSize } = options;
  const where = buildWhere({ search });

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map(toListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getProduct(id: string): Promise<ProductWithRelations> {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: productInclude,
  });
  if (!product) {
    throw new DomainError("NOT_FOUND", "Product not found.", 404);
  }
  return product;
}

/**
 * Creates a product together with its inventory record. When the product is
 * created with opening stock, the initial quantity is logged as a stock
 * movement so every stock change is recorded.
 */
export async function createProduct(
  input: ProductCreatePayload
): Promise<Product> {
  const { initialStock, lowStockAt, ...data } = input;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        barcode: data.barcode,
        sku: data.sku,
        hsn: data.hsn,
        unit: data.unit,
        price: data.price,
        gstRate: data.gstRate,
      },
    });

    await tx.inventory.create({
      data: { productId: product.id, quantity: initialStock, lowStockAt },
    });

    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: initialStock,
          reason: "Opening stock",
        },
      });
    }

    return product;
  });
}

export async function updateProduct(
  id: string,
  input: ProductUpdatePayload
): Promise<Product> {
  await getProduct(id);

  const data: Prisma.ProductUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.barcode !== undefined) data.barcode = input.barcode;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.hsn !== undefined) data.hsn = input.hsn;
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.price !== undefined) data.price = input.price;
  if (input.gstRate !== undefined) data.gstRate = input.gstRate;

  return prisma.product.update({ where: { id }, data });
}

/**
 * Soft-deletes a product. The row is kept so existing invoices and quotations
 * keep their references; it is simply hidden from active product lists.
 */
export async function deleteProduct(id: string): Promise<Product> {
  await getProduct(id);
  return prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
