"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Trash2,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { SearchInput } from "@/components/search-input";
import { StockStatusBadge } from "@/components/stock-status";
import { TablePagination } from "@/components/table-pagination";
import { TableSkeleton } from "@/components/table-skeleton";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { formatMoney } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useDeleteProduct, useProducts } from "@/features/products/hooks";
import { ProductFormDialog } from "@/features/products/product-form-dialog";
import { ProductStockDialog } from "@/features/products/product-stock-dialog";
import type { ProductListItem } from "@/features/products/types";

const PAGE_SIZE = 10;

export function ProductsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(
    null
  );
  const [stockProduct, setStockProduct] = useState<ProductListItem | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(
    null
  );

  const debouncedSearch = useDebouncedValue(search);
  const deleteProduct = useDeleteProduct();

  const productsQuery = useProducts({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });

  function changePage(nextPage: number) {
    setPage(nextPage);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: ProductListItem) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const wasLastOnPage = productsQuery.data?.items.length === 1 && page > 1;
    await deleteProduct.mutateAsync(deleteTarget.id);
    if (wasLastOnPage) setPage(page - 1);
    setDeleteTarget(null);
  }

  const hasItems = (productsQuery.data?.items.length ?? 0) > 0;

  return (
    <>
      <div className="mb-4 space-y-2">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search products..."
          className="w-full"
        />
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button
            className="h-10 w-full sm:ml-auto sm:h-9 sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Add product
          </Button>
        </div>
      </div>

      {productsQuery.isPending ? (
        <TableSkeleton columns={5} />
      ) : productsQuery.isError ? (
        <ErrorState
          message="We couldn't load your products. Please try again."
          onRetry={() => productsQuery.refetch()}
        />
      ) : !hasItems ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            search
              ? "Try a different search term."
              : "Add your first product to start building your catalogue."
          }
          action={
            search ? undefined : (
              <Button onClick={openCreate}>
                <Plus />
                Add product
              </Button>
            )
          }
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Product</DataTableHead>
              <DataTableHead>SKU</DataTableHead>
              <DataTableHead className="text-right">Price</DataTableHead>
              <DataTableHead className="text-right">GST</DataTableHead>
              <DataTableHead>Stock</DataTableHead>
              <DataTableHead className="w-12" />
            </tr>
          </DataTableHeader>
          <tbody>
            {productsQuery.data.items.map((product) => (
              <DataTableRow key={product.id}>
                <DataTableCell variant="title">
                  <p className="text-on-surface font-medium">{product.name}</p>
                </DataTableCell>
                <DataTableCell label="SKU" className="text-on-surface-variant">
                  {product.sku ?? "—"}
                </DataTableCell>
                <DataTableCell
                  label="Price"
                  className="text-on-surface text-right tabular-nums"
                >
                  {formatMoney(product.price)}
                </DataTableCell>
                <DataTableCell
                  label="GST"
                  className="text-on-surface text-right tabular-nums"
                >
                  {product.gstRate}%
                </DataTableCell>
                <DataTableCell label="Stock">
                  {product.inventory ? (
                    <StockStatusBadge
                      quantity={product.inventory.quantity}
                      lowStockAt={product.inventory.lowStockAt}
                      unit={product.unit}
                    />
                  ) : (
                    <span className="text-on-surface-variant text-xs">—</span>
                  )}
                </DataTableCell>
                <DataTableCell variant="actions">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Product actions"
                        className="text-on-surface-variant hover:text-primary max-md:size-9"
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(product)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStockProduct(product)}
                      >
                        <Warehouse />
                        Adjust stock
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(product)}
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
        page={productsQuery.data?.pagination.page ?? 1}
        pageSize={productsQuery.data?.pagination.pageSize ?? PAGE_SIZE}
        total={productsQuery.data?.pagination.total ?? 0}
        onPageChange={changePage}
      />

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
      />
      <ProductStockDialog
        open={stockProduct !== null}
        onOpenChange={(open) => {
          if (!open) setStockProduct(null);
        }}
        product={stockProduct}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Existing invoices and quotations will keep their references, but the product will no longer be available.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
