export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

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
  pagination: Pagination;
};

export type StockAdjustmentResult = {
  productId: string;
  quantity: number;
  lowStockAt: number;
};
