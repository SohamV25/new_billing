"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { formatDate, formatMoney } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  useConvertQuotation,
  useDeleteQuotation,
  useDuplicateQuotation,
  useQuotations,
} from "@/features/quotations/hooks";
import { QuotationFormDialog } from "@/features/quotations/quotation-form-dialog";
import type { QuotationListItem } from "@/features/quotations/types";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CONVERTED", label: "Converted" },
] as const;

const BLOCKED_STATUSES = new Set(["EXPIRED", "REJECTED", "CONVERTED"]);

type QuotationsViewProps = {
  companyState: string | null;
};

export function QuotationsView({ companyState }: QuotationsViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuotationListItem | null>(
    null
  );
  const [convertTarget, setConvertTarget] = useState<QuotationListItem | null>(
    null
  );

  const debouncedSearch = useDebouncedValue(search);
  const deleteQuotation = useDeleteQuotation();
  const duplicateQuotation = useDuplicateQuotation();
  const convertQuotation = useConvertQuotation();

  const quotationsQuery = useQuotations({
    search: debouncedSearch,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasItems = (quotationsQuery.data?.items.length ?? 0) > 0;

  function changePage(nextPage: number) {
    setPage(nextPage);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(value: string) {
    setStatus(value);
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(quotation: QuotationListItem) {
    setEditingId(quotation.id);
    setFormOpen(true);
  }

  async function handleDuplicate(quotation: QuotationListItem) {
    const result = await duplicateQuotation.mutateAsync({
      id: quotation.id,
      input: { status: "DRAFT" },
    });
    router.push(`/quotations/${result.id}`);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const wasLastOnPage = quotationsQuery.data?.items.length === 1 && page > 1;
    await deleteQuotation.mutateAsync(deleteTarget.id);
    if (wasLastOnPage) setPage(page - 1);
    setDeleteTarget(null);
  }

  async function handleConvert() {
    if (!convertTarget) return;
    await convertQuotation.mutateAsync({ id: convertTarget.id, input: {} });
    setConvertTarget(null);
  }

  const isFiltering = search || status !== "all";

  return (
    <>
      <div className="mb-4 space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search quotations..."
          className="w-full"
        />
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={status} onValueChange={handleStatusFilter}>
            <SelectTrigger
              className="h-10 w-full sm:h-9 sm:w-44"
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
          <Button
            className="h-10 w-full sm:ml-auto sm:h-9 sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            New quotation
          </Button>
        </div>
      </div>

      {quotationsQuery.isPending ? (
        <TableSkeleton columns={6} />
      ) : quotationsQuery.isError ? (
        <ErrorState
          message="We couldn't load your quotations. Please try again."
          onRetry={() => quotationsQuery.refetch()}
        />
      ) : !hasItems ? (
        <EmptyState
          icon={FileText}
          title="No quotations found"
          description={
            isFiltering
              ? "Try adjusting your search or filters."
              : "Create your first quotation to share a detailed estimate with a customer."
          }
          action={
            isFiltering ? undefined : (
              <Button onClick={openCreate}>
                <Plus />
                New quotation
              </Button>
            )
          }
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Quotation</DataTableHead>
              <DataTableHead>Customer</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Valid until</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Total</DataTableHead>
              <DataTableHead className="w-12" />
            </tr>
          </DataTableHeader>
          <tbody>
            {quotationsQuery.data.items.map((quotation) => (
              <DataTableRow key={quotation.id}>
                <DataTableCell
                  variant="title"
                  className="text-on-surface font-medium"
                >
                  {quotation.quotationNo}
                </DataTableCell>
                <DataTableCell
                  label="Customer"
                  className="md:max-w-40 md:truncate"
                >
                  {quotation.customer.name}
                </DataTableCell>
                <DataTableCell label="Date" className="text-on-surface-variant">
                  {formatDate(quotation.date)}
                </DataTableCell>
                <DataTableCell
                  label="Valid until"
                  className="text-on-surface-variant"
                >
                  {quotation.validUntil
                    ? formatDate(quotation.validUntil)
                    : "—"}
                </DataTableCell>
                <DataTableCell label="Status">
                  <StatusBadge
                    status={
                      quotation.status.toLowerCase() as
                        | "draft"
                        | "sent"
                        | "accepted"
                        | "rejected"
                        | "expired"
                        | "converted"
                    }
                  />
                </DataTableCell>
                <DataTableCell
                  label="Total"
                  className="text-on-surface text-right tabular-nums"
                >
                  {formatMoney(quotation.totalAmount)}
                </DataTableCell>
                <DataTableCell variant="actions">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quotation actions"
                        className="text-on-surface-variant hover:text-primary max-md:size-9"
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(quotation)}
                      >
                        <Copy />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEdit(quotation)}
                        disabled={quotation.status === "CONVERTED"}
                      >
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      {!BLOCKED_STATUSES.has(quotation.status) ? (
                        <DropdownMenuItem
                          onClick={() => setConvertTarget(quotation)}
                        >
                          <ReceiptText />
                          Convert to invoice
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(quotation)}
                        disabled={quotation.status === "CONVERTED"}
                      >
                        <Trash2 />
                        Delete
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
        page={quotationsQuery.data?.pagination.page ?? 1}
        pageSize={quotationsQuery.data?.pagination.pageSize ?? PAGE_SIZE}
        total={quotationsQuery.data?.pagination.total ?? 0}
        onPageChange={changePage}
      />

      <QuotationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        quotationId={editingId}
        companyState={companyState}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete quotation"
        description={`Delete "${deleteTarget?.quotationNo}"? This will permanently remove the quotation and its line items.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={convertTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConvertTarget(null);
        }}
        title="Convert to invoice"
        description={`Convert "${convertTarget?.quotationNo}" into a PENDING invoice? The quotation will be marked as converted and its line items and totals will be copied to the new invoice.`}
        confirmLabel="Convert"
        onConfirm={handleConvert}
      />
    </>
  );
}
