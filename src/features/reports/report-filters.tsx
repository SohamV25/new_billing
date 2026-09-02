"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/search-input";
import { useCustomers } from "@/features/customers/hooks";
import { EntityCombobox } from "@/components/entity-combobox";
import {
  GRANULARITY_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  REPORT_FILTERS,
  SALES_STATUS_OPTIONS,
  TOP_N_OPTIONS,
} from "./report-config";
import type { ReportQuery, ReportType } from "./types";

type ReportFiltersProps = {
  type: ReportType;
  filters: ReportQuery;
  onChange: (patch: Partial<ReportQuery>) => void;
};

function StatusFilter({
  type,
  value,
  onChange,
}: {
  type: ReportType;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const options =
    type === "sales"
      ? SALES_STATUS_OPTIONS
      : type === "payments"
        ? PAYMENT_STATUS_OPTIONS
        : INVENTORY_STATUS_OPTIONS;

  return (
    <Select
      value={value ?? "all"}
      onValueChange={(next) => onChange(next === "all" ? undefined : next)}
    >
      <SelectTrigger
        className="h-10 w-full sm:h-9 sm:w-44"
        aria-label="Filter by status"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ReportFilters({ type, filters, onChange }: ReportFiltersProps) {
  const config = REPORT_FILTERS[type];

  const customersQuery = useCustomers({ page: 1, pageSize: 200 });

  const customerOptions = useMemo(
    () =>
      (customersQuery.data?.items ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((customer) => ({
          id: customer.id,
          label: customer.name,
          sublabel:
            [customer.city, customer.state].filter(Boolean).join(", ") ||
            undefined,
        })),
    [customersQuery.data]
  );

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    Boolean(filters.customerId) ||
    Boolean(filters.status) ||
    Boolean(filters.method) ||
    Boolean(filters.topN) ||
    (filters.granularity !== undefined && filters.granularity !== "auto") ||
    Boolean(filters.overdueOnly);

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      {config.search ? (
        <SearchInput
          value={filters.search ?? ""}
          onChange={(value) => onChange({ search: value })}
          placeholder="Search…"
          className="col-span-2 w-full sm:max-w-xs"
        />
      ) : null}

      {config.dateRange ? (
        <>
          <Input
            type="date"
            value={filters.from ?? ""}
            onChange={(event) =>
              onChange({ from: event.target.value || undefined })
            }
            aria-label="From date"
            className="h-10 w-full sm:h-9 sm:w-40"
          />
          <Input
            type="date"
            value={filters.to ?? ""}
            onChange={(event) =>
              onChange({ to: event.target.value || undefined })
            }
            aria-label="To date"
            className="h-10 w-full sm:h-9 sm:w-40"
          />
        </>
      ) : null}

      {config.customer ? (
        <div className="flex items-center gap-1">
          <EntityCombobox
            options={customerOptions}
            value={filters.customerId ?? ""}
            onChange={(id) => onChange({ customerId: id })}
            placeholder="All customers"
            isLoading={customersQuery.isPending}
            className="h-10 w-full sm:h-9 sm:w-52"
          />
          {filters.customerId ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear customer filter"
              onClick={() => onChange({ customerId: undefined })}
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}

      {config.status ? (
        <StatusFilter
          type={type}
          value={filters.status}
          onChange={(value) => onChange({ status: value })}
        />
      ) : null}

      {config.method ? (
        <Select
          value={filters.method ?? "all"}
          onValueChange={(next) =>
            onChange({ method: next === "all" ? undefined : next })
          }
        >
          <SelectTrigger
            className="h-10 w-full sm:h-9 sm:w-40"
            aria-label="Filter by method"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {config.topN ? (
        <Select
          value={filters.topN ? String(filters.topN) : "all"}
          onValueChange={(next) =>
            onChange({ topN: next === "all" ? undefined : Number(next) })
          }
        >
          <SelectTrigger
            className="w-full sm:w-32"
            aria-label="Results to show"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Top 10</SelectItem>
            {TOP_N_OPTIONS.map((count) => (
              <SelectItem key={count} value={String(count)}>
                Top {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {config.granularity ? (
        <Select
          value={filters.granularity ?? "auto"}
          onValueChange={(next) =>
            onChange({ granularity: next === "auto" ? undefined : next })
          }
        >
          <SelectTrigger
            className="h-10 w-full sm:h-9 sm:w-36"
            aria-label="Bucket by"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {config.overdueOnly ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(filters.overdueOnly)}
            onChange={(event) =>
              onChange({ overdueOnly: event.target.checked || undefined })
            }
            className="size-4 rounded border"
          />
          Overdue only
        </label>
      ) : null}

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              search: undefined,
              from: undefined,
              to: undefined,
              customerId: undefined,
              status: undefined,
              method: undefined,
              topN: undefined,
              granularity: undefined,
              overdueOnly: undefined,
            })
          }
        >
          Reset
        </Button>
      ) : null}
    </div>
  );
}
