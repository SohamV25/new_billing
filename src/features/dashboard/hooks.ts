"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { dashboardApi } from "./api";
import type { DashboardQueryClient, SalesGranularity } from "./types";

export function buildDashboardQuery(
  range: { from?: string; to?: string },
  topN: number,
  granularity: SalesGranularity
): DashboardQueryClient {
  return {
    from: range.from,
    to: range.to,
    topN,
    granularity,
  };
}

export function useDashboard(query: DashboardQueryClient) {
  return useQuery({
    queryKey: ["dashboard", query],
    queryFn: () => dashboardApi.get(query),
    placeholderData: (previousData) => previousData,
  });
}

export function invalidateDashboardData(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}
