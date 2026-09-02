"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "border-outline-variant mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 sm:px-4",
        className
      )}
    >
      <p className="text-on-surface-variant text-xs sm:text-sm">
        Showing <span className="text-on-surface font-medium">{from}</span>–
        <span className="text-on-surface font-medium">{to}</span> of{" "}
        <span className="text-on-surface font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          className="max-md:size-10"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span className="font-geist text-mono-sm text-on-surface-variant px-2 whitespace-nowrap">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          className="max-md:size-10"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
