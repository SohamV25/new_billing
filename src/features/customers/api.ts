import { apiFetch } from "@/lib/client/api";
import type {
  CustomerCreatePayload,
  CustomerUpdatePayload,
} from "@/lib/validations/customer";
import type { CustomerDetail, CustomerListResult } from "./types";

export type CustomerListQuery = {
  search?: string;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
};

function buildListQuery(query: CustomerListQuery): string {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.set("search", query.search);
  if (query.city) searchParams.set("city", query.city);
  if (query.state) searchParams.set("state", query.state);
  if (query.page) searchParams.set("page", String(query.page));
  if (query.pageSize) searchParams.set("pageSize", String(query.pageSize));
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const customersApi = {
  list(query: CustomerListQuery): Promise<CustomerListResult> {
    return apiFetch(`/api/customers${buildListQuery(query)}`);
  },
  get(id: string): Promise<CustomerDetail> {
    return apiFetch(`/api/customers/${id}`);
  },
  create(input: CustomerCreatePayload): Promise<CustomerDetail> {
    return apiFetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(id: string, input: CustomerUpdatePayload): Promise<CustomerDetail> {
    return apiFetch(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  remove(id: string) {
    return apiFetch(`/api/customers/${id}`, { method: "DELETE" });
  },
};
