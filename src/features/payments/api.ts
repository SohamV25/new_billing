import { apiFetch } from "@/lib/client/api";
import type { PaymentListQuery, PaymentListResult } from "./types";

function buildListQuery(query: PaymentListQuery): string {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.set("search", query.search);
  if (query.method) searchParams.set("method", query.method);
  if (query.status) searchParams.set("status", query.status);
  if (query.page) searchParams.set("page", String(query.page));
  if (query.pageSize) searchParams.set("pageSize", String(query.pageSize));
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const paymentsApi = {
  list(query: PaymentListQuery): Promise<PaymentListResult> {
    return apiFetch(`/api/payments${buildListQuery(query)}`);
  },
  listCustomerPayments(
    customerId: string,
    query: PaymentListQuery
  ): Promise<PaymentListResult> {
    return apiFetch(
      `/api/customers/${customerId}/payments${buildListQuery(query)}`
    );
  },
};
