import { apiFetch } from "@/lib/client/api";
import type {
  InvoiceCreatePayload,
  InvoiceUpdatePayload,
} from "@/lib/validations/invoice";
import type {
  PaymentCreatePayload,
  PaymentUpdatePayload,
} from "@/lib/validations/payment";
import type {
  InvoiceDetail,
  InvoiceListResult,
  PaymentDetail,
  TimelineEntry,
} from "./types";

export type InvoiceListQuery = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function buildListQuery(query: InvoiceListQuery): string {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.set("search", query.search);
  if (query.status) searchParams.set("status", query.status);
  if (query.page) searchParams.set("page", String(query.page));
  if (query.pageSize) searchParams.set("pageSize", String(query.pageSize));
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const invoicesApi = {
  list(query: InvoiceListQuery): Promise<InvoiceListResult> {
    return apiFetch(`/api/invoices${buildListQuery(query)}`);
  },
  get(id: string): Promise<InvoiceDetail> {
    return apiFetch(`/api/invoices/${id}`);
  },
  create(input: InvoiceCreatePayload): Promise<InvoiceDetail> {
    return apiFetch("/api/invoices", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(id: string, input: InvoiceUpdatePayload): Promise<InvoiceDetail> {
    return apiFetch(`/api/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  remove(id: string) {
    return apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
  },
  finalize(id: string): Promise<InvoiceDetail> {
    return apiFetch(`/api/invoices/${id}/finalize`, { method: "POST" });
  },
  cancel(id: string): Promise<InvoiceDetail> {
    return apiFetch(`/api/invoices/${id}/cancel`, { method: "POST" });
  },
  duplicate(id: string): Promise<InvoiceDetail> {
    return apiFetch(`/api/invoices/${id}/duplicate`, { method: "POST" });
  },
  timeline(id: string): Promise<TimelineEntry[]> {
    return apiFetch(`/api/invoices/${id}/timeline`);
  },
  listPayments(id: string): Promise<PaymentDetail[]> {
    return apiFetch(`/api/invoices/${id}/payments`);
  },
  addPayment(id: string, input: PaymentCreatePayload): Promise<PaymentDetail> {
    return apiFetch(`/api/invoices/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updatePayment(
    invoiceId: string,
    paymentId: string,
    input: PaymentUpdatePayload
  ): Promise<PaymentDetail> {
    return apiFetch(`/api/invoices/${invoiceId}/payments/${paymentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  refundPayment(invoiceId: string, paymentId: string): Promise<PaymentDetail> {
    return apiFetch(`/api/invoices/${invoiceId}/payments/${paymentId}/refund`, {
      method: "POST",
    });
  },
  deletePayment(
    invoiceId: string,
    paymentId: string
  ): Promise<{ id: string; invoiceId: string }> {
    return apiFetch(`/api/invoices/${invoiceId}/payments/${paymentId}`, {
      method: "DELETE",
    });
  },
};
