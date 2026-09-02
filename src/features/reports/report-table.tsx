"use client";

import type { ReportColumn } from "@/lib/reports/columns";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { TablePagination } from "@/components/table-pagination";
import { cn } from "@/lib/utils";
import type { ReportPagination } from "./types";

type ReportTableProps<T> = {
  columns: ReportColumn<T>[];
  items: T[];
  rowKey: (row: T) => string;
  pagination: ReportPagination;
  onPageChange: (page: number) => void;
};

export function ReportTable<T>({
  columns,
  items,
  rowKey,
  pagination,
  onPageChange,
}: ReportTableProps<T>) {
  return (
    <>
      <DataTable>
        <DataTableHeader>
          <tr>
            {columns.map((column) => (
              <DataTableHead
                key={column.key}
                className={cn(column.align === "right" && "text-right")}
              >
                {column.label}
              </DataTableHead>
            ))}
          </tr>
        </DataTableHeader>
        <tbody>
          {items.map((row) => (
            <DataTableRow key={rowKey(row)}>
              {columns.map((column, index) => (
                <DataTableCell
                  key={column.key}
                  // first column heads the card on mobile; the rest are labelled
                  variant={index === 0 ? "title" : "default"}
                  label={column.label}
                  className={cn(
                    "text-on-surface-variant",
                    column.align === "right" && "md:text-right",
                    column.mono && "font-geist text-mono-sm text-on-surface",
                    index === 0 && "text-on-surface font-medium"
                  )}
                >
                  {String(column.value(row))}
                </DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </tbody>
      </DataTable>
      <TablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={onPageChange}
      />
    </>
  );
}
