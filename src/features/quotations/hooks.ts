"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/client/api";
import type {
  QuotationConvertPayload,
  QuotationCreatePayload,
  QuotationDuplicatePayload,
  QuotationUpdatePayload,
} from "@/lib/validations/quotation";
import { quotationsApi, type QuotationListQuery } from "./api";

function invalidateQuotationData(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: ["quotations"] });
  void queryClient.invalidateQueries({ queryKey: ["quotation"] });
  void queryClient.invalidateQueries({ queryKey: ["customers"] });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useQuotations(query: QuotationListQuery) {
  return useQuery({
    queryKey: ["quotations", query],
    queryFn: () => quotationsApi.list(query),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationsApi.get(id),
    enabled: id.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuotationCreatePayload) => quotationsApi.create(input),
    onSuccess: () => {
      invalidateQuotationData(queryClient);
      toast.success("Quotation created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: QuotationUpdatePayload;
    }) => quotationsApi.update(id, input),
    onSuccess: () => {
      invalidateQuotationData(queryClient);
      toast.success("Quotation updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotationsApi.remove(id),
    onSuccess: () => {
      invalidateQuotationData(queryClient);
      toast.success("Quotation deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: QuotationDuplicatePayload;
    }) => quotationsApi.duplicate(id, input),
    onSuccess: () => {
      invalidateQuotationData(queryClient);
      toast.success("Quotation duplicated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useConvertQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: QuotationConvertPayload;
    }) => quotationsApi.convert(id, input),
    onSuccess: () => {
      invalidateQuotationData(queryClient);
      toast.success("Quotation converted to invoice");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
