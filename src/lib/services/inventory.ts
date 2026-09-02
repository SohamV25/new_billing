import {
  Prisma,
  type Inventory,
  type InventoryChangeType,
  type StockMovement,
} from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type {
  InventoryAdjustPayload,
  StockStatusFilter,
} from "@/lib/validations/inventory";

export type StockAdjustmentResult = {
  productId: string;
  quantity: number;
  lowStockAt: number;
};

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryListItem = {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  quantity: number;
  lowStockAt: number;
  status: StockStatus;
  lastUpdatedAt: string;
};

export type InventorySummary = {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

export type InventoryListResult = {
  items: InventoryListItem[];
  summary: InventorySummary;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type MovementListItem = {
  id: string;
  type: InventoryChangeType;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
  };
  user: { id: string; name: string } | null;
};

export type MovementListResult = {
  items: MovementListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type InventoryWithProduct = Inventory & {
  product: {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
  };
};

type MovementWithRelations = StockMovement & {
  product: {
    id: string;
    name: string;
    sku: string | null;
    unit: string | null;
  };
  user: { id: string; name: string } | null;
};

const inventoryInclude = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
    },
  },
} satisfies Prisma.InventoryInclude;

const movementInclude = {
  product: { select: { id: true, name: true, sku: true, unit: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.StockMovementInclude;

export function computeStockStatus(
  quantity: number,
  lowStockAt: number
): StockStatus {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= lowStockAt) return "LOW_STOCK";
  return "IN_STOCK";
}

function toInventoryListItem(row: InventoryWithProduct): InventoryListItem {
  return {
    id: row.product.id,
    name: row.product.name,
    sku: row.product.sku,
    unit: row.product.unit,
    quantity: row.quantity,
    lowStockAt: row.lowStockAt,
    status: computeStockStatus(row.quantity, row.lowStockAt),
    lastUpdatedAt: row.lastUpdatedAt.toISOString(),
  };
}

function toMovementListItem(movement: MovementWithRelations): MovementListItem {
  return {
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    createdAt: movement.createdAt.toISOString(),
    product: {
      id: movement.product.id,
      name: movement.product.name,
      sku: movement.product.sku,
      unit: movement.product.unit,
    },
    user: movement.user
      ? { id: movement.user.id, name: movement.user.name }
      : null,
  };
}

/**
 * Lists current stock levels for active products. The search filter
 * run in SQL; the low/in-stock status is evaluated in JS because Prisma cannot
 * compare the `quantity` and `lowStockAt` columns inside a `where` clause.
 */
export async function listInventory(options: {
  search: string;
  status?: StockStatusFilter;
  page: number;
  pageSize: number;
}): Promise<InventoryListResult> {
  const { search, status, page, pageSize } = options;

  const productWhere: Prisma.ProductWhereInput = { deletedAt: null };
  if (search) {
    productWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { hsn: { contains: search, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.inventory.findMany({
    where: { product: productWhere },
    include: inventoryInclude,
    orderBy: { product: { name: "asc" } },
  });

  const statusByProduct = new Map(
    rows.map((row) => [
      row.product.id,
      computeStockStatus(row.quantity, row.lowStockAt),
    ])
  );

  const summary: InventorySummary = {
    totalItems: rows.length,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  };
  for (const stockStatus of statusByProduct.values()) {
    if (stockStatus === "IN_STOCK") summary.inStock += 1;
    else if (stockStatus === "LOW_STOCK") summary.lowStock += 1;
    else summary.outOfStock += 1;
  }

  const statusToStockStatus: Record<
    Exclude<StockStatusFilter, "all">,
    StockStatus
  > = {
    in: "IN_STOCK",
    low: "LOW_STOCK",
    out: "OUT_OF_STOCK",
  };

  const statusMatch =
    !status || status === "all"
      ? rows
      : rows.filter(
          (row) =>
            statusByProduct.get(row.product.id) === statusToStockStatus[status]
        );

  return {
    items: statusMatch
      .slice((page - 1) * pageSize, page * pageSize)
      .map(toInventoryListItem),
    summary,
    pagination: {
      page,
      pageSize,
      total: statusMatch.length,
      totalPages: Math.max(1, Math.ceil(statusMatch.length / pageSize)),
    },
  };
}

/**
 * Lists the stock-movement audit trail, newest first. Soft-deleted products
 * remain visible here so historical movements keep their context.
 */
export async function listMovements(options: {
  search: string;
  type?: InventoryChangeType;
  page: number;
  pageSize: number;
}): Promise<MovementListResult> {
  const { search, type, page, pageSize } = options;

  const where: Prisma.StockMovementWhereInput = {};
  if (type) where.type = type;
  if (search) {
    where.product = { name: { contains: search, mode: "insensitive" } };
  }

  const [movements, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: movementInclude,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    items: movements.map(toMovementListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/**
 * Applies a stock movement in a single transaction. IN adds, OUT subtracts,
 * ADJUSTMENT sets an absolute level. The transaction never allows the stock
 * to go negative and always records a StockMovement row for the change.
 */
export async function adjustInventory(
  productId: string,
  input: InventoryAdjustPayload,
  userId?: string
): Promise<StockAdjustmentResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) {
    throw new DomainError("NOT_FOUND", "Product not found.", 404);
  }

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.upsert({
      where: { productId },
      update: {},
      create: { productId, quantity: 0, lowStockAt: 5 },
    });

    const nextQuantity =
      input.type === "IN"
        ? inventory.quantity + input.quantity
        : input.type === "OUT"
          ? inventory.quantity - input.quantity
          : input.quantity;

    if (nextQuantity < 0) {
      throw new DomainError(
        "NEGATIVE_STOCK",
        "Stock cannot become negative.",
        422
      );
    }

    const updated = await tx.inventory.update({
      where: { productId },
      data: {
        quantity: nextQuantity,
        ...(input.lowStockAt !== undefined
          ? { lowStockAt: input.lowStockAt }
          : {}),
      },
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type: input.type,
        quantity: input.quantity,
        reason:
          input.reason ??
          (input.type === "ADJUSTMENT"
            ? `Adjusted to ${input.quantity}`
            : undefined),
        userId,
      },
    });

    return {
      productId,
      quantity: updated.quantity,
      lowStockAt: updated.lowStockAt,
    };
  });
}
