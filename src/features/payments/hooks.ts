"use client";

import { useQuery } from "@tanstack/react-query";

import { paymentsApi } from "./api";
import type { PaymentListQuery } from "./types";

export function usePayments(query: PaymentListQuery) {
  return useQuery({
    queryKey: ["payments", query],
    queryFn: () => paymentsApi.list(query),
  });
}

export function useCustomerPayments(
  customerId: string,
  query: PaymentListQuery
) {
  return useQuery({
    queryKey: ["customer-payments", customerId, query],
    queryFn: () => paymentsApi.listCustomerPayments(customerId, query),
    enabled: customerId.length > 0,
  });
}
