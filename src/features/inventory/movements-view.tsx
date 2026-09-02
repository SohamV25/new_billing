"use client";

import { useState } from "react";
import { ArrowDownUp } from "lucide-react";

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
import { StatusBadge } from "@/components/status-badge";
import { TablePagination } from "@/components/table-pagination";
import { TableSkeleton } from "@/components/table-skeleton";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useInventoryMovements } from "@/features/inventory/hooks";
import type { MovementListItem } from "@/features/inventory/types";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "all", label: "All movements" },
  { value: "IN", label: "Stock in" },
  { value: "OUT", label: "Stock out" },
  { value: "ADJUSTMENT", label: "Adjustments" },
] as const;

type TypeValue = (typeof TYPE_OPTIONS)[number]["value"];

function MovementTypeBadge({ type }: { type: MovementListItem["type"] }) {
  if (type === "IN") {
    return <StatusBadge status="in" />;
  }
  if (type === "OUT") {
    return <StatusBadge status="out" />;
  }
  return <StatusBadge status="adjustment" />;
}

function MovementQuantity({
  type,
  quantity,
}: {
  type: MovementListItem["type"];
  quantity: number;
}) {
  if (type === "IN") {
    return (
      <span className="text-success text-sm font-medium">
        +{formatNumber(quantity)}
      </span>
    );
  }
  if (type === "OUT") {
    return (
      <span className="text-error text-sm font-medium">
        −{formatNumber(quantity)}
      </span>
    );
  }
  return (
    <span className="text-on-surface text-sm font-medium">
      {formatNumber(quantity)}
    </span>
  );
}

export function MovementsView() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeValue>("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  const movementsQuery = useInventoryMovements({
    search: debouncedSearch,
    type,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasItems = (movementsQuery.data?.items.length ?? 0) > 0;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleTypeFilter(value: TypeValue) {
    setType(value);
    setPage(1);
  }

  return (
    <>
      <div className="space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search movements..."
          className="w-full"
        />
        <Select value={type} onValueChange={handleTypeFilter}>
          <SelectTrigger
            className="h-10 w-full sm:h-9 sm:w-52"
            aria-label="Filter by movement type"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {movementsQuery.isPending ? (
          <TableSkeleton columns={5} />
        ) : movementsQuery.isError ? (
          <ErrorState
            message="We couldn't load your movements. Please try again."
            onRetry={() => movementsQuery.refetch()}
          />
        ) : !hasItems ? (
          <EmptyState
            icon={ArrowDownUp}
            title="No movements found"
            description={
              search || type !== "all"
                ? "Try adjusting your search or filters."
                : "Stock movements will appear here as inventory changes."
            }
          />
        ) : (
          <DataTable>
            <DataTableHeader>
              <tr>
                <DataTableHead>Product</DataTableHead>
                <DataTableHead>Date</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead className="text-right">Quantity</DataTableHead>
                <DataTableHead>Reason</DataTableHead>
              </tr>
            </DataTableHeader>
            <tbody>
              {movementsQuery.data.items.map((movement) => (
                <DataTableRow key={movement.id}>
                  <DataTableCell
                    variant="title"
                    className="text-on-surface font-medium"
                  >
                    {movement.product.name}
                  </DataTableCell>
                  <DataTableCell
                    label="Date"
                    className="text-on-surface-variant whitespace-nowrap"
                  >
                    {formatDateTime(movement.createdAt)}
                  </DataTableCell>
                  <DataTableCell label="Type">
                    <MovementTypeBadge type={movement.type} />
                  </DataTableCell>
                  <DataTableCell
                    label="Quantity"
                    className="text-on-surface text-right tabular-nums"
                  >
                    {formatNumber(movement.quantity)}
                  </DataTableCell>
                  <DataTableCell
                    label="Reason"
                    className="text-on-surface-variant"
                  >
                    {movement.reason || "—"}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </tbody>
          </DataTable>
        )}

        <TablePagination
          page={movementsQuery.data?.pagination.page ?? 1}
          pageSize={movementsQuery.data?.pagination.pageSize ?? PAGE_SIZE}
          total={movementsQuery.data?.pagination.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
