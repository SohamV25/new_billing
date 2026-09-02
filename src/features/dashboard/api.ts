import { apiFetch } from "@/lib/client/api";
import type { DashboardData, DashboardQueryClient } from "./types";

function buildQueryParams(query: DashboardQueryClient): URLSearchParams {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.topN) params.set("topN", String(query.topN));
  if (query.granularity) params.set("granularity", query.granularity);
  return params;
}

export const dashboardApi = {
  async get(query: DashboardQueryClient): Promise<DashboardData> {
    const params = buildQueryParams(query);
    return apiFetch<DashboardData>(`/api/dashboard?${params.toString()}`);
  },
};
