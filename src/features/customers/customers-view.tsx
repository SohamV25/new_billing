"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react";

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
import { formatNumber } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { useCustomers, useDeleteCustomer } from "@/features/customers/hooks";
import type { CustomerListItem } from "@/features/customers/types";

const PAGE_SIZE = 10;

export function CustomersView() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [state, setState] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(
    null
  );

  const debouncedSearch = useDebouncedValue(search);
  const deleteCustomer = useDeleteCustomer();

  const customersQuery = useCustomers({
    search: debouncedSearch,
    city: city === "all" ? undefined : city,
    state: state === "all" ? undefined : state,
    page,
    pageSize: PAGE_SIZE,
  });

  const filters = customersQuery.data?.filters;
  const hasItems = (customersQuery.data?.items.length ?? 0) > 0;

  function changePage(nextPage: number) {
    setPage(nextPage);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCityFilter(value: string) {
    setCity(value);
    setPage(1);
  }

  function handleStateFilter(value: string) {
    setState(value);
    setPage(1);
  }

  function openCreate() {
    setEditingCustomer(null);
    setFormOpen(true);
  }

  function openEdit(customer: CustomerListItem) {
    setEditingCustomer(customer);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const wasLastOnPage = customersQuery.data?.items.length === 1 && page > 1;
    await deleteCustomer.mutateAsync(deleteTarget.id);
    if (wasLastOnPage) setPage(page - 1);
    setDeleteTarget(null);
  }

  const isFiltering = search || city !== "all" || state !== "all";

  return (
    <>
      <div className="mb-4 space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search customers..."
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={city} onValueChange={handleCityFilter}>
            <SelectTrigger
              className="h-10 w-full sm:h-9 sm:w-40"
              aria-label="Filter by city"
            >
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {filters?.cities.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={handleStateFilter}>
            <SelectTrigger
              className="h-10 w-full sm:h-9 sm:w-40"
              aria-label="Filter by state"
            >
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {filters?.states.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="col-span-2 h-10 w-full sm:ml-auto sm:h-9 sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Add customer
          </Button>
        </div>
      </div>

      {customersQuery.isPending ? (
        <TableSkeleton columns={5} />
      ) : customersQuery.isError ? (
        <ErrorState
          message="We couldn't load your customers. Please try again."
          onRetry={() => customersQuery.refetch()}
        />
      ) : !hasItems ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            isFiltering
              ? "Try adjusting your search or filters."
              : "Add your first customer to start building your address book."
          }
          action={
            isFiltering ? undefined : (
              <Button onClick={openCreate}>
                <Plus />
                Add customer
              </Button>
            )
          }
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Customer</DataTableHead>
              <DataTableHead>Phone</DataTableHead>
              <DataTableHead>Location</DataTableHead>
              <DataTableHead>GSTIN</DataTableHead>
              <DataTableHead className="text-right">Invoices</DataTableHead>
              <DataTableHead className="w-12" />
            </tr>
          </DataTableHeader>
          <tbody>
            {customersQuery.data.items.map((customer) => (
              <DataTableRow key={customer.id}>
                <DataTableCell variant="title">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="text-on-surface hover:text-primary font-medium transition-colors"
                  >
                    {customer.name}
                  </Link>
                  {customer.email ? (
                    <p className="text-on-surface-variant mt-0.5 text-xs">
                      {customer.email}
                    </p>
                  ) : null}
                </DataTableCell>
                <DataTableCell
                  label="Phone"
                  className="text-on-surface-variant"
                >
                  {customer.phone ?? "—"}
                </DataTableCell>
                <DataTableCell
                  label="Location"
                  className="text-on-surface-variant"
                >
                  {[customer.city, customer.state].filter(Boolean).join(", ") ||
                    "—"}
                </DataTableCell>
                <DataTableCell
                  label="GSTIN"
                  className="text-on-surface-variant"
                >
                  {customer.gstin ?? "—"}
                </DataTableCell>
                <DataTableCell
                  label="Invoices"
                  className="text-on-surface text-right tabular-nums"
                >
                  {formatNumber(customer.invoiceCount)}
                </DataTableCell>
                <DataTableCell variant="actions">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Customer actions"
                        className="text-on-surface-variant hover:text-primary max-md:size-9"
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/customers/${customer.id}`}>
                          <Eye />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(customer)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(customer)}
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
        page={customersQuery.data?.pagination.page ?? 1}
        pageSize={customersQuery.data?.pagination.pageSize ?? PAGE_SIZE}
        total={customersQuery.data?.pagination.total ?? 0}
        onPageChange={changePage}
      />

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete customer"
        description={`Delete "${deleteTarget?.name}"? ${
          deleteTarget && deleteTarget.invoiceCount > 0
            ? `This customer has ${formatNumber(deleteTarget.invoiceCount)} invoice(s). Their billing history will be preserved, but the customer will no longer appear in active lists.`
            : "Their history will be preserved, but the customer will no longer appear in active lists."
        }`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
