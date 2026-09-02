import { apiFetch } from "@/lib/client/api";
import type {
  QuotationConvertPayload,
  QuotationCreatePayload,
  QuotationDuplicatePayload,
  QuotationUpdatePayload,
} from "@/lib/validations/quotation";
import type {
  ConvertResult,
  QuotationDetail,
  QuotationListResult,
} from "./types";

export type QuotationListQuery = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function buildListQuery(query: QuotationListQuery): string {
  const searchParams = new URLSearchParams();
  if (query.search) searchParams.set("search", query.search);
  if (query.status) searchParams.set("status", query.status);
  if (query.page) searchParams.set("page", String(query.page));
  if (query.pageSize) searchParams.set("pageSize", String(query.pageSize));
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const quotationsApi = {
  list(query: QuotationListQuery): Promise<QuotationListResult> {
    return apiFetch(`/api/quotations${buildListQuery(query)}`);
  },
  get(id: string): Promise<QuotationDetail> {
    return apiFetch(`/api/quotations/${id}`);
  },
  create(input: QuotationCreatePayload): Promise<QuotationDetail> {
    return apiFetch("/api/quotations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  update(id: string, input: QuotationUpdatePayload): Promise<QuotationDetail> {
    return apiFetch(`/api/quotations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  remove(id: string) {
    return apiFetch(`/api/quotations/${id}`, { method: "DELETE" });
  },
  duplicate(
    id: string,
    input: QuotationDuplicatePayload
  ): Promise<QuotationDetail> {
    return apiFetch(`/api/quotations/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  convert(id: string, input: QuotationConvertPayload): Promise<ConvertResult> {
    return apiFetch(`/api/quotations/${id}/convert`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
