import { apiFetch } from "@/lib/client/api";
import type { ReportExportResult, ReportQuery, ReportResult } from "./types";

export function buildReportQuery(query: ReportQuery): string {
  const params = new URLSearchParams();
  params.set("type", query.type);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.customerId) params.set("customerId", query.customerId);
  if (query.status) params.set("status", query.status);
  if (query.method) params.set("method", query.method);
  if (query.search) params.set("search", query.search);
  if (query.topN) params.set("topN", String(query.topN));
  if (query.granularity) params.set("granularity", query.granularity);
  if (query.overdueOnly) params.set("overdueOnly", "true");
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  return params.toString();
}

export const reportsApi = {
  list(query: ReportQuery): Promise<ReportResult> {
    return apiFetch(`/api/reports?${buildReportQuery(query)}`);
  },
  exportRows(query: ReportQuery): Promise<ReportExportResult> {
    return apiFetch(`/api/reports/export?${buildReportQuery(query)}`);
  },
};
