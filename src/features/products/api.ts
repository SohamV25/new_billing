import { apiFetch } from "@/lib/client/api";
import type { InventoryAdjustPayload } from "@/lib/validations/inventory";
import type {
  ProductCreatePayload,
  ProductUpdatePayload,
} from "@/lib/validations/product";
import type { ProductListResult, StockAdjustmentResult } from "./types";

export type ListQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
};

function buildListQuery(query: ListQuery): string {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.set("search", query.search);
  if (query.page) searchParams.set("page", String(query.page));
  if (query.pageSize) searchParams.set("pageSize", String(query.pageSize));
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const productsApi = {
  list(query: ListQuery): Promise<ProductListResult> {
    return apiFetch(`/api/products${buildListQuery(query)}`);
  },
  create(input: ProductCreatePayload) {
    return apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(id: string, input: ProductUpdatePayload) {
    return apiFetch(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  remove(id: string) {
    return apiFetch(`/api/products/${id}`, { method: "DELETE" });
  },
  adjustStock(
    id: string,
    input: InventoryAdjustPayload
  ): Promise<StockAdjustmentResult> {
    return apiFetch(`/api/products/${id}/stock`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
