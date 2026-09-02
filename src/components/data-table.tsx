"use client";

import { cn } from "@/lib/utils";

/**
 * Responsive data table. This app is used on phones, so the same markup renders
 * two ways:
 *
 *   md and up  — a real <table> with a sticky header and aligned columns.
 *   below md   — every row collapses into a card: the `title` cell is the
 *                heading, the `actions` cell pins to its right, and the rest
 *                become label/value pairs. Nothing is hidden on mobile.
 *
 * Give every non-title cell a `label` so it stays readable in card mode, and
 * render loading/empty/error states *outside* DataTable — a <div> is not valid
 * inside <table>.
 */

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div
      className={cn(
        "border-outline-variant bg-surface-container overflow-hidden rounded-2xl border",
        className
      )}
    >
      <div className="md:overflow-x-auto">
        <table
          className={cn(
            "w-full text-left",
            // card mode: table and body flow as blocks
            "max-md:block",
            "[&>tbody]:max-md:divide-outline-variant [&>tbody]:max-md:block [&>tbody]:max-md:divide-y"
          )}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

type DataTableHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <thead
      className={cn(
        "border-outline-variant bg-surface-container-high sticky top-0 z-10 border-b max-md:hidden",
        className
      )}
    >
      {children}
    </thead>
  );
}

type DataTableRowProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataTableRow({ children, className }: DataTableRowProps) {
  return (
    <tr
      className={cn(
        "border-outline-variant/60 hover:bg-surface-container-high border-b transition-colors last:border-0",
        // card mode: title top-left, actions top-right, rest stacked beneath
        "max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-start max-md:gap-x-3 max-md:gap-y-2.5 max-md:border-0 max-md:p-4",
        className
      )}
    >
      {children}
    </tr>
  );
}

type DataTableHeadProps = {
  children?: React.ReactNode;
  className?: string;
};

export function DataTableHead({ children, className }: DataTableHeadProps) {
  return (
    <th
      className={cn(
        "text-on-surface-variant px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap uppercase sm:px-5",
        className
      )}
    >
      {children}
    </th>
  );
}

type DataTableCellProps = {
  children: React.ReactNode;
  /** Shown beside the value in card mode. Set it on every non-title cell. */
  label?: string;
  /** title = row heading on mobile; actions = pinned top-right on mobile. */
  variant?: "default" | "title" | "actions";
  className?: string;
};

const cellVariants = {
  default:
    "max-md:col-span-2 max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-0",
  title:
    "max-md:col-start-1 max-md:row-start-1 max-md:block max-md:px-0 max-md:py-0",
  actions:
    "max-md:col-start-2 max-md:row-start-1 max-md:flex max-md:justify-end max-md:px-0 max-md:py-0",
} as const;

export function DataTableCell({
  children,
  label,
  variant = "default",
  className,
}: DataTableCellProps) {
  return (
    <td
      className={cn(
        "text-on-surface px-4 py-3.5 align-middle text-sm sm:px-5",
        cellVariants[variant],
        className
      )}
    >
      {label && variant === "default" ? (
        <span className="text-on-surface-variant shrink-0 text-xs font-medium md:hidden">
          {label}
        </span>
      ) : null}
      <span
        className={cn(
          "max-md:min-w-0",
          variant === "default" && "max-md:text-right max-md:font-medium"
        )}
      >
        {children}
      </span>
    </td>
  );
}
