"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  HandCoins,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  XCircle,
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
  useCancelInvoice,
  useDeleteInvoice,
  useFinalizeInvoice,
  useInvoices,
} from "@/features/invoices/hooks";
import { InvoiceFormDialog } from "@/features/invoices/invoice-form-dialog";
import { PaymentFormDialog } from "@/features/invoices/payment-form-dialog";
import type { InvoiceListItem, InvoiceStatus } from "@/features/invoices/types";

const PAGE_SIZE = 10;

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All Invoices" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_PAID", label: "Processing" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "VOID", label: "Void" },
];

export function InvoicesView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceListItem | null>(
    null
  );
  const [finalizeTarget, setFinalizeTarget] = useState<InvoiceListItem | null>(
    null
  );
  const [cancelTarget, setCancelTarget] = useState<InvoiceListItem | null>(
    null
  );
  const [paymentTarget, setPaymentTarget] = useState<InvoiceListItem | null>(
    null
  );

  const debouncedSearch = useDebouncedValue(search);
  const deleteInvoice = useDeleteInvoice();
  const finalizeInvoice = useFinalizeInvoice();
  const cancelInvoice = useCancelInvoice();

  const invoicesQuery = useInvoices({
    search: debouncedSearch,
    status: status === "all" ? undefined : status,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasItems = (invoicesQuery.data?.items.length ?? 0) > 0;

  function changePage(nextPage: number) {
    setPage(nextPage);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(value: string) {
    setStatus(value as InvoiceStatus | "all");
    setPage(1);
  }

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(invoice: InvoiceListItem) {
    setEditingId(invoice.id);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const wasLastOnPage = invoicesQuery.data?.items.length === 1 && page > 1;
    await deleteInvoice.mutateAsync(deleteTarget.id);
    if (wasLastOnPage) setPage(page - 1);
    setDeleteTarget(null);
  }

  async function handleFinalize() {
    if (!finalizeTarget) return;
    await finalizeInvoice.mutateAsync(finalizeTarget.id);
    setFinalizeTarget(null);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    const wasLastOnPage = invoicesQuery.data?.items.length === 1 && page > 1;
    await cancelInvoice.mutateAsync(cancelTarget.id);
    if (wasLastOnPage) setPage(page - 1);
    setCancelTarget(null);
  }

  const isFiltering = search !== "" || status !== "all";

  return (
    <>
      <div className="mb-4 space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search invoices..."
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
            New invoice
          </Button>
        </div>
      </div>

      {invoicesQuery.isPending ? (
        <TableSkeleton columns={6} />
      ) : invoicesQuery.isError ? (
        <ErrorState
          message="We couldn't load your invoices. Please try again."
          onRetry={() => invoicesQuery.refetch()}
        />
      ) : !hasItems ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            isFiltering
              ? "Try adjusting your search or filters."
              : "Create your first invoice to bill a customer."
          }
          action={
            isFiltering ? undefined : (
              <Button onClick={openCreate}>
                <Plus />
                New invoice
              </Button>
            )
          }
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Invoice</DataTableHead>
              <DataTableHead>Customer</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Due</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Total</DataTableHead>
              <DataTableHead className="text-right">Balance</DataTableHead>
              <DataTableHead className="w-12" />
            </tr>
          </DataTableHeader>
          <tbody>
            {invoicesQuery.data.items.map((invoice) => {
              const isDraft = invoice.status === "DRAFT";
              // Editable until money has been collected against it.
              const canEdit =
                (invoice.status === "DRAFT" ||
                  invoice.status === "PENDING" ||
                  invoice.status === "OVERDUE") &&
                invoice.balance === invoice.totalAmount;
              const canRecordPayment =
                invoice.status === "PENDING" ||
                invoice.status === "PARTIALLY_PAID" ||
                invoice.status === "OVERDUE";
              const canCancel =
                (invoice.status === "PENDING" ||
                  invoice.status === "OVERDUE") &&
                invoice.balance === invoice.totalAmount;
              return (
                <DataTableRow key={invoice.id}>
                  <DataTableCell variant="title">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-on-surface hover:text-primary font-medium transition-colors"
                    >
                      {invoice.invoiceNo}
                    </Link>
                  </DataTableCell>
                  <DataTableCell
                    label="Customer"
                    className="md:max-w-40 md:truncate"
                  >
                    {invoice.customer.name}
                  </DataTableCell>
                  <DataTableCell
                    label="Date"
                    className="text-on-surface-variant"
                  >
                    {formatDate(invoice.invoiceDate)}
                  </DataTableCell>
                  <DataTableCell
                    label="Due"
                    className="text-on-surface-variant"
                  >
                    {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                  </DataTableCell>
                  <DataTableCell label="Status">
                    <StatusBadge
                      status={
                        invoice.status.toLowerCase() as
                          | "paid"
                          | "pending"
                          | "overdue"
                          | "draft"
                          | "cancelled"
                          | "partially_paid"
                      }
                    />
                  </DataTableCell>
                  <DataTableCell
                    label="Total"
                    className="text-on-surface text-right font-medium tabular-nums"
                  >
                    {formatMoney(invoice.totalAmount)}
                  </DataTableCell>
                  <DataTableCell
                    label="Balance"
                    className="text-on-surface-variant text-right tabular-nums"
                  >
                    {formatMoney(invoice.balance)}
                  </DataTableCell>
                  <DataTableCell variant="actions">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Invoice actions"
                          className="text-on-surface-variant hover:text-primary max-md:size-9"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isDraft ? (
                          <DropdownMenuItem
                            onClick={() => setFinalizeTarget(invoice)}
                          >
                            <CheckCircle2 />
                            Finalize
                          </DropdownMenuItem>
                        ) : null}
                        {canRecordPayment ? (
                          <DropdownMenuItem
                            onClick={() => setPaymentTarget(invoice)}
                          >
                            <HandCoins />
                            Record payment
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => openEdit(invoice)}
                          disabled={!canEdit}
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        {canCancel ? (
                          <DropdownMenuItem
                            onClick={() => setCancelTarget(invoice)}
                          >
                            <XCircle />
                            Cancel invoice
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(invoice)}
                          disabled={!isDraft}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </tbody>
        </DataTable>
      )}

      <TablePagination
        page={invoicesQuery.data?.pagination.page ?? 1}
        pageSize={invoicesQuery.data?.pagination.pageSize ?? PAGE_SIZE}
        total={invoicesQuery.data?.pagination.total ?? 0}
        onPageChange={changePage}
      />

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoiceId={editingId}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete invoice"
        description={`Delete "${deleteTarget?.invoiceNo}"? This will permanently remove the invoice and its line items.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={finalizeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setFinalizeTarget(null);
        }}
        title="Finalize invoice"
        description={`Finalize "${finalizeTarget?.invoiceNo}"? Stock will be deducted for its items and the invoice will be issued.`}
        confirmLabel="Finalize"
        onConfirm={handleFinalize}
      />
      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancel invoice"
        description={`Cancel "${cancelTarget?.invoiceNo}"? The deducted stock will be restored and the invoice will no longer be collectable.`}
        confirmLabel="Cancel"
        destructive
        onConfirm={handleCancel}
      />
      {paymentTarget ? (
        <PaymentFormDialog
          open={paymentTarget !== null}
          onOpenChange={(open) => {
            if (!open) setPaymentTarget(null);
          }}
          invoiceId={paymentTarget.id}
          outstanding={paymentTarget.balance}
        />
      ) : null}
    </>
  );
}
