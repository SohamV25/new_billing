export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
  pagination: Pagination;
};

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export type MovementListItem = {
  id: string;
  type: MovementType;
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
  pagination: Pagination;
};
