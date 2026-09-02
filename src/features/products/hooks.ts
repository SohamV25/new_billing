"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/client/api";
import type { InventoryAdjustPayload } from "@/lib/validations/inventory";
import type {
  ProductCreatePayload,
  ProductUpdatePayload,
} from "@/lib/validations/product";
import { productsApi, type ListQuery } from "./api";

function invalidateCatalogueData(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: ["products"] });
  void queryClient.invalidateQueries({ queryKey: ["inventory"] });
  void queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useProducts(query: ListQuery) {
  return useQuery({
    queryKey: ["products", query],
    queryFn: () => productsApi.list(query),
  });
}

// ---------------------------------------------------------------------------
// Product mutations
// ---------------------------------------------------------------------------

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductCreatePayload) => productsApi.create(input),
    onSuccess: () => {
      invalidateCatalogueData(queryClient);
      toast.success("Product created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdatePayload }) =>
      productsApi.update(id, input),
    onSuccess: () => {
      invalidateCatalogueData(queryClient);
      toast.success("Product updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      invalidateCatalogueData(queryClient);
      toast.success("Product deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: InventoryAdjustPayload;
    }) => productsApi.adjustStock(id, input),
    onSuccess: () => {
      invalidateCatalogueData(queryClient);
      toast.success("Stock updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ---------------------------------------------------------------------------
