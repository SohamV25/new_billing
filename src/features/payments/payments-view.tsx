"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, HandCoins } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { SearchInput } from "@/components/search-input";
import { TablePagination } from "@/components/table-pagination";
import { TableSkeleton } from "@/components/table-skeleton";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { usePayments } from "@/features/payments/hooks";
import type { PaymentMethod, PaymentStatus } from "@/features/payments/types";

const PAGE_SIZE = 10;

const METHOD_FILTERS: { value: PaymentMethod | "all"; label: string }[] = [
  { value: "all", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
  { value: "CHEQUE", label: "Cheque" },
];

const STATUS_FILTERS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
];

export function PaymentsView() {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  const paymentsQuery = usePayments({
    search: debouncedSearch,
    method: method === "all" ? undefined : method,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasItems = (paymentsQuery.data?.items.length ?? 0) > 0;

  function changePage(nextPage: number) {
    setPage(nextPage);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleMethodFilter(value: string) {
    setMethod(value as PaymentMethod | "all");
    setPage(1);
  }

  function handleStatusFilter(value: string) {
    setStatus(value as PaymentStatus | "all");
    setPage(1);
  }

  const isFiltering = search !== "" || method !== "all" || status !== "all";

  return (
    <>
      <div className="mb-4 space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search payments..."
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={method} onValueChange={handleMethodFilter}>
            <SelectTrigger
              className="h-10 w-full sm:h-9 sm:w-40"
              aria-label="Filter by method"
            >
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              {METHOD_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={handleStatusFilter}>
            <SelectTrigger
              className="h-10 w-full sm:h-9 sm:w-40"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {paymentsQuery.isPending ? (
        <TableSkeleton columns={6} />
      ) : paymentsQuery.isError ? (
        <ErrorState
          message="We couldn't load your payments. Please try again."
          onRetry={() => paymentsQuery.refetch()}
        />
      ) : !hasItems ? (
        <EmptyState
          icon={HandCoins}
          title="No payments found"
          description={
            isFiltering
              ? "Try adjusting your search or filters."
              : "Record a payment on an issued invoice and it will appear here."
          }
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Invoice</DataTableHead>
              <DataTableHead>Customer</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Method</DataTableHead>
              <DataTableHead>Reference</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Recorded by</DataTableHead>
              <DataTableHead className="text-right">Amount</DataTableHead>
              <DataTableHead className="w-12" />
            </tr>
          </DataTableHeader>
          <tbody>
            {paymentsQuery.data.items.map((payment) => (
              <DataTableRow key={payment.id}>
                <DataTableCell
                  variant="title"
                  className="text-on-surface font-medium"
                >
                  <Link
                    href={`/invoices/${payment.invoiceId}`}
                    className="hover:text-primary"
                  >
                    {payment.invoiceNo}
                  </Link>
                </DataTableCell>
                <DataTableCell
                  label="Customer"
                  className="md:max-w-40 md:truncate"
                >
                  <Link
                    href={`/customers/${payment.customer.id}`}
                    className="text-on-surface hover:text-primary"
                  >
                    {payment.customer.name}
                  </Link>
                </DataTableCell>
                <DataTableCell
                  label="Date"
                  className="text-on-surface-variant whitespace-nowrap"
                >
                  {formatDateTime(payment.paidAt)}
                </DataTableCell>
                <DataTableCell
                  label="Method"
                  className="text-on-surface-variant"
                >
                  {payment.method.replace("_", " ")}
                </DataTableCell>
                <DataTableCell
                  label="Reference"
                  className="text-on-surface-variant"
                >
                  {payment.reference ?? "—"}
                </DataTableCell>
                <DataTableCell label="Status">
                  <StatusBadge
                    status={
                      payment.status.toLowerCase() as
                        "completed" | "pending" | "refunded" | "failed"
                    }
                  />
                </DataTableCell>
                <DataTableCell
                  label="Recorded by"
                  className="text-on-surface-variant"
                >
                  {payment.user.name}
                </DataTableCell>
                <DataTableCell
                  label="Amount"
                  className="text-on-surface text-right font-medium tabular-nums"
                >
                  {formatMoney(payment.amount)}
                </DataTableCell>
                <DataTableCell variant="actions">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Payment actions"
                        className="text-on-surface-variant hover:text-primary max-md:size-9"
                      >
                        <Eye />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/invoices/${payment.invoiceId}`}>
                          <Eye />
                          View invoice
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DataTableCell>
              </DataTableRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <TablePagination
        page={paymentsQuery.data?.pagination.page ?? 1}
        pageSize={paymentsQuery.data?.pagination.pageSize ?? PAGE_SIZE}
        total={paymentsQuery.data?.pagination.total ?? 0}
        onPageChange={changePage}
      />
    </>
  );
}
