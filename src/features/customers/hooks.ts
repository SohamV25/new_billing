"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/client/api";
import type {
  CustomerCreatePayload,
  CustomerUpdatePayload,
} from "@/lib/validations/customer";
import { customersApi, type CustomerListQuery } from "./api";

function invalidateCustomerData(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: ["customers"] });
  void queryClient.invalidateQueries({ queryKey: ["customer"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useCustomers(query: CustomerListQuery) {
  return useQuery({
    queryKey: ["customers", query],
    queryFn: () => customersApi.list(query),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.get(id),
    enabled: id.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerCreatePayload) => customersApi.create(input),
    onSuccess: () => {
      invalidateCustomerData(queryClient);
      toast.success("Customer created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerUpdatePayload }) =>
      customersApi.update(id, input),
    onSuccess: () => {
      invalidateCustomerData(queryClient);
      toast.success("Customer updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      invalidateCustomerData(queryClient);
      toast.success("Customer deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
