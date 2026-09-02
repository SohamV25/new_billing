"use client";

import { useQuery } from "@tanstack/react-query";

import {
  inventoryApi,
  type InventoryListQuery,
  type MovementListQuery,
} from "./api";

export function useInventory(query: InventoryListQuery) {
  return useQuery({
    queryKey: ["inventory", query],
    queryFn: () => inventoryApi.list(query),
  });
}

export function useInventoryMovements(query: MovementListQuery) {
  return useQuery({
    queryKey: ["inventory-movements", query],
    queryFn: () => inventoryApi.movements(query),
  });
}
