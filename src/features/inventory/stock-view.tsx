"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Package, Warehouse } from "lucide-react";

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
import { StockStatusBadge } from "@/components/stock-status";
import { TablePagination } from "@/components/table-pagination";
import { TableSkeleton } from "@/components/table-skeleton";
import { KpiCard } from "@/features/dashboard/kpi-card";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { formatDate, formatNumber } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  ProductStockDialog,
  type StockTarget,
} from "@/features/products/product-stock-dialog";
import { useInventory } from "@/features/inventory/hooks";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All stock" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

export function StockView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusValue>("all");
  const [page, setPage] = useState(1);
  const [stockTarget, setStockTarget] = useState<StockTarget | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const inventoryQuery = useInventory({
    search: debouncedSearch,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const summary = inventoryQuery.data?.summary;
  const hasItems = (inventoryQuery.data?.items.length ?? 0) > 0;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(value: StatusValue) {
    setStatus(value);
    setPage(1);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total items"
          value={summary ? formatNumber(summary.totalItems) : "—"}
        />
        <KpiCard
          label="In stock"
          value={summary ? formatNumber(summary.inStock) : "—"}
          subTone="success"
        />
        <KpiCard
          label="Low stock"
          value={summary ? formatNumber(summary.lowStock) : "—"}
          subTone="warning"
        />
        <KpiCard
          label="Out of stock"
          value={summary ? formatNumber(summary.outOfStock) : "—"}
          subTone="error"
        />
      </div>

      <div className="mt-5 space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search stock..."
          className="w-full"
        />
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={status} onValueChange={handleStatusFilter}>
            <SelectTrigger
              className="h-10 w-full sm:h-9 sm:w-44"
              aria-label="Filter by stock status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {inventoryQuery.isPending ? (
          <TableSkeleton columns={6} />
        ) : inventoryQuery.isError ? (
          <ErrorState
            message="We couldn't load your inventory. Please try again."
            onRetry={() => inventoryQuery.refetch()}
          />
        ) : !hasItems ? (
          <EmptyState
            icon={Package}
            title="No stock found"
            description={
              search || status !== "all"
                ? "Try adjusting your search or filters."
                : "Add products to see their stock levels here."
            }
          />
        ) : (
          <DataTable>
            <DataTableHeader>
              <tr>
                <DataTableHead>Product</DataTableHead>
                <DataTableHead>SKU</DataTableHead>
                <DataTableHead>Stock</DataTableHead>
                <DataTableHead className="text-right">
                  Low-stock at
                </DataTableHead>
                <DataTableHead>Last updated</DataTableHead>
                <DataTableHead className="w-12" />
              </tr>
            </DataTableHeader>
            <tbody>
              {inventoryQuery.data.items.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell variant="title">
                    <p className="text-on-surface font-medium">{item.name}</p>
                  </DataTableCell>
                  <DataTableCell
                    label="SKU"
                    className="text-on-surface-variant"
                  >
                    {item.sku ?? "—"}
                  </DataTableCell>
                  <DataTableCell label="Stock">
                    <StockStatusBadge
                      quantity={item.quantity}
                      lowStockAt={item.lowStockAt}
                      unit={item.unit}
                    />
                  </DataTableCell>
                  <DataTableCell
                    label="Low-stock at"
                    className="text-on-surface text-right tabular-nums"
                  >
                    {formatNumber(item.lowStockAt)}
                  </DataTableCell>
                  <DataTableCell
                    label="Last updated"
                    className="text-on-surface-variant"
                  >
                    {formatDate(item.lastUpdatedAt)}
                  </DataTableCell>
                  <DataTableCell variant="actions">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Stock actions"
                          className="text-on-surface-variant hover:text-primary max-md:size-9"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setStockTarget({
                              id: item.id,
                              name: item.name,
                              inventory: {
                                quantity: item.quantity,
                                lowStockAt: item.lowStockAt,
                              },
                            })
                          }
                        >
                          <Warehouse />
                          Adjust stock
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
          page={inventoryQuery.data?.pagination.page ?? 1}
          pageSize={inventoryQuery.data?.pagination.pageSize ?? PAGE_SIZE}
          total={inventoryQuery.data?.pagination.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      <ProductStockDialog
        open={stockTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStockTarget(null);
        }}
        product={stockTarget}
      />
    </>
  );
}
