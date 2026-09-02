"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/client/api";
import type {
  InvoiceCreatePayload,
  InvoiceUpdatePayload,
} from "@/lib/validations/invoice";
import type {
  PaymentCreatePayload,
  PaymentUpdatePayload,
} from "@/lib/validations/payment";
import { invoicesApi, type InvoiceListQuery } from "./api";

function invalidateInvoiceData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["invoices"] });
  void queryClient.invalidateQueries({ queryKey: ["invoice"] });
  void queryClient.invalidateQueries({ queryKey: ["invoice-timeline"] });
  void queryClient.invalidateQueries({ queryKey: ["invoice-payments"] });
  void queryClient.invalidateQueries({ queryKey: ["payments"] });
  void queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
  void queryClient.invalidateQueries({ queryKey: ["customers"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

function invalidateInvoiceAndStock(
  queryClient: ReturnType<typeof useQueryClient>
) {
  invalidateInvoiceData(queryClient);
  void queryClient.invalidateQueries({ queryKey: ["inventory"] });
  void queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useInvoices(query: InvoiceListQuery) {
  return useQuery({
    queryKey: ["invoices", query],
    queryFn: () => invoicesApi.list(query),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.get(id),
    enabled: id.length > 0,
  });
}

export function useInvoicePayments(id: string) {
  return useQuery({
    queryKey: ["invoice-payments", id],
    queryFn: () => invoicesApi.listPayments(id),
    enabled: id.length > 0,
  });
}

export function useInvoiceTimeline(id: string) {
  return useQuery({
    queryKey: ["invoice-timeline", id],
    queryFn: () => invoicesApi.timeline(id),
    enabled: id.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvoiceCreatePayload) => invoicesApi.create(input),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Invoice created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InvoiceUpdatePayload }) =>
      invoicesApi.update(id, input),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Invoice updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.remove(id),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Invoice deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useFinalizeInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.finalize(id),
    onSuccess: () => {
      invalidateInvoiceAndStock(queryClient);
      toast.success("Invoice finalized");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.cancel(id),
    onSuccess: () => {
      invalidateInvoiceAndStock(queryClient);
      toast.success("Invoice cancelled");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDuplicateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.duplicate(id),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Invoice duplicated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PaymentCreatePayload }) =>
      invoicesApi.addPayment(id, input),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Payment recorded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      paymentId,
      input,
    }: {
      id: string;
      paymentId: string;
      input: PaymentUpdatePayload;
    }) => invoicesApi.updatePayment(id, paymentId, input),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Payment updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId: string }) =>
      invoicesApi.deletePayment(id, paymentId),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Payment deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentId }: { id: string; paymentId: string }) =>
      invoicesApi.refundPayment(id, paymentId),
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
      toast.success("Payment refunded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
