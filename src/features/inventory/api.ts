import { apiFetch } from "@/lib/client/api";
import type {
  MovementTypeFilter,
  StockStatusFilter,
} from "@/lib/validations/inventory";
import type { InventoryListResult, MovementListResult } from "./types";

export type InventoryListQuery = {
  search?: string;
  status?: StockStatusFilter;
  page?: number;
  pageSize?: number;
};

export type MovementListQuery = {
  search?: string;
  type?: MovementTypeFilter;
  page?: number;
  pageSize?: number;
};

function buildListQuery(query: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    searchParams.set(key, String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const inventoryApi = {
  list(query: InventoryListQuery): Promise<InventoryListResult> {
    return apiFetch(`/api/inventory${buildListQuery(query)}`);
  },
  movements(query: MovementListQuery): Promise<MovementListResult> {
    return apiFetch(`/api/inventory/movements${buildListQuery(query)}`);
  },
};
