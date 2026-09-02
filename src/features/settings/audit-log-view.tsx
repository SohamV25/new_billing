"use client";

import { useState } from "react";
import { History } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/search-input";
import { TableSkeleton } from "@/components/table-skeleton";
import { TablePagination } from "@/components/table-pagination";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { useAuditLog } from "./hooks";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { formatDateTime } from "@/lib/format";

const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "INVOICE_CREATED",
  "INVOICE_UPDATED",
  "INVOICE_DELETED",
  "INVOICE_FINALIZED",
  "INVOICE_PAYMENT_RECEIVED",
  "INVOICE_CANCELLED",
  "PAYMENT_UPDATED",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "QUOTATION_CREATED",
  "QUOTATION_UPDATED",
  "QUOTATION_DELETED",
  "QUOTATION_CONVERTED",
  "INVENTORY_ADJUSTMENT",
  "ROLE_CHANGED",
  "SETTINGS_CHANGED",
  "CUSTOMER_CREATED",
  "CUSTOMER_UPDATED",
  "CUSTOMER_DELETED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "PROFILE_UPDATED",
  "PASSWORD_CHANGED",
  "PREFERENCES_UPDATED",
  "USER_CREATED",
  "USER_ROLE_UPDATED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "ROLE_PERMISSIONS_UPDATED",
  "BACKUP_EXPORTED",
  "BACKUP_IMPORTED",
];

export function AuditLogView() {
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading } = useAuditLog({
    action: action || undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: 10,
  });

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  };

  return (
    <>
      <div className="space-y-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search audit log..."
          className="w-full"
        />
        <Select onValueChange={setAction} value={action}>
          <SelectTrigger className="h-10 w-full sm:h-9 sm:w-48">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : items.length === 0 ? (
          <div className="border-outline-variant text-on-surface-variant rounded-2xl border py-10 text-center text-sm">
            No audit entries found.
          </div>
        ) : (
          <DataTable>
            <DataTableHeader>
              <tr>
                <DataTableHead>Action</DataTableHead>
                <DataTableHead>Entity</DataTableHead>
                <DataTableHead>User</DataTableHead>
                <DataTableHead>Timestamp</DataTableHead>
              </tr>
            </DataTableHeader>
            <tbody>
              {items.map((entry) => (
                <DataTableRow key={entry.id}>
                  <DataTableCell variant="title">
                    <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
                      {entry.action}
                    </span>
                  </DataTableCell>
                  <DataTableCell
                    label="Entity"
                    className="text-on-surface-variant text-xs"
                  >
                    {entry.entityType ?? "—"}
                  </DataTableCell>
                  <DataTableCell
                    label="User"
                    className="text-on-surface-variant text-xs md:max-w-32 md:truncate"
                  >
                    {entry.userName ?? entry.userEmail ?? "—"}
                  </DataTableCell>
                  <DataTableCell
                    label="Timestamp"
                    className="text-on-surface-variant text-xs whitespace-nowrap"
                  >
                    {formatDateTime(entry.createdAt)}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </tbody>
          </DataTable>
        )}

        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
