"use client";

import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "./api";
import type { ReportQuery } from "./types";

export function useReport(query: ReportQuery) {
  return useQuery({
    queryKey: ["report", query],
    queryFn: () => reportsApi.list(query),
  });
}
