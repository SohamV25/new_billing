"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/table-skeleton";
import { getErrorMessage } from "@/lib/client/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatMoney } from "@/lib/format";
import {
  REPORT_COLUMNS,
  type ReportRow,
  type RevenueTrendRow,
} from "@/lib/reports/columns";
import { cn } from "@/lib/utils";
import { useReport } from "./hooks";
import { buildReportQuery, reportsApi } from "./api";
import {
  REPORT_DESCRIPTIONS,
  REPORT_ORDER,
  REPORT_TITLES,
} from "./report-config";
import { ReportFilters } from "./report-filters";
import { ReportSummary } from "./report-summary";
import { ReportTable } from "./report-table";
import type { ReportQuery, ReportType } from "./types";

const PAGE_SIZE = 10;

const FILTER_KEYS = [
  "from",
  "to",
  "customerId",
  "status",
  "method",
  "search",
  "topN",
  "granularity",
  "overdueOnly",
] as const;

function rowKeyFor(type: ReportType): (row: ReportRow) => string {
  if (type === "revenue-trends") {
    return (row) => (row as RevenueTrendRow).periodKey;
  }
  return (row) => (row as { id: string }).id;
}

function queryWithoutPagination(query: ReportQuery): ReportQuery {
  const rest: ReportQuery = { ...query };
  delete rest.page;
  delete rest.pageSize;
  return rest;
}

export function ReportsView() {
  const [type, setType] = useState<ReportType>("sales");
  const [query, setQuery] = useState<ReportQuery>({
    type: "sales",
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [exporting, setExporting] = useState(false);

  const reportQuery = useReport(query);
  const hasActiveFilters = useMemo(() => {
    return FILTER_KEYS.some((key) => query[key] !== undefined);
  }, [query]);

  function changeType(nextType: ReportType) {
    setType(nextType);
    setQuery({ type: nextType, page: 1, pageSize: PAGE_SIZE });
  }

  function patchQuery(patch: Partial<ReportQuery>) {
    setQuery((current) => ({ ...current, ...patch, page: 1 }));
  }

  function changePage(page: number) {
    setQuery((current) => ({ ...current, page }));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { rows } = await reportsApi.exportRows(query);
      const columns = REPORT_COLUMNS[type];
      const csv = toCsv(
        columns.map((column) => column.label),
        rows.map((row) => columns.map((column) => column.value(row)))
      );
      downloadCsv(`${type}-report.csv`, csv);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  const columns = REPORT_COLUMNS[type];
  const hasItems = (reportQuery.data?.items.length ?? 0) > 0;
  const meta = reportQuery.data?.meta;
  const rateBreakdown = meta?.rateBreakdown;

  return (
    <>
      <PageHeader
        title={REPORT_TITLES[type]}
        description={REPORT_DESCRIPTIONS[type]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting || !hasItems}
            >
              <Download />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
            <Button asChild>
              <Link
                href={`/reports/print?${buildReportQuery(
                  queryWithoutPagination(query)
                )}`}
                target="_blank"
              >
                <Printer />
                Print
              </Link>
            </Button>
          </>
        }
      />

      {/* Ten report types cannot sit in a phone-width strip. */}
      <div className="mb-5 md:hidden">
        <Select
          value={type}
          onValueChange={(next) => changeType(next as ReportType)}
        >
          <SelectTrigger className="h-11 w-full" aria-label="Report">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_ORDER.map((reportType) => (
              <SelectItem key={reportType} value={reportType}>
                {REPORT_TITLES[reportType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-outline-variant bg-surface-container scrollbar-hide mb-6 hidden gap-1 overflow-x-auto rounded-xl border p-1 md:flex">
        {REPORT_ORDER.map((reportType) => (
          <button
            key={reportType}
            type="button"
            onClick={() => changeType(reportType)}
            className={cn(
              "text-on-surface-variant hover:text-on-surface shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              reportType === type && "bg-primary/12 text-primary"
            )}
          >
            {REPORT_TITLES[reportType]}
          </button>
        ))}
      </div>

      <ReportFilters type={type} filters={query} onChange={patchQuery} />

      <div className="mt-6">
        <ReportSummary items={reportQuery.data?.summary} />
      </div>

      <div className="mt-4">
        {reportQuery.isPending ? (
          <TableSkeleton columns={columns.length} />
        ) : reportQuery.isError ? (
          <ErrorState
            message="We couldn't load this report. Please try again."
            onRetry={() => reportQuery.refetch()}
          />
        ) : !hasItems ? (
          <EmptyState
            icon={BarChart3}
            title="No data found"
            description={
              hasActiveFilters
                ? "Try adjusting your filters."
                : "This report will populate as invoices and payments are recorded."
            }
          />
        ) : (
          <ReportTable
            columns={columns}
            items={reportQuery.data?.items ?? []}
            rowKey={rowKeyFor(type)}
            pagination={
              reportQuery.data?.pagination ?? {
                page: 1,
                pageSize: PAGE_SIZE,
                total: 0,
                totalPages: 1,
              }
            }
            onPageChange={changePage}
          />
        )}
      </div>

      {rateBreakdown && rateBreakdown.length > 0 ? (
        <div className="border-outline-variant bg-surface-container mt-4 rounded-2xl border p-4">
          <p className="text-body-sm text-on-surface font-medium">
            GST by rate
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {rateBreakdown.map((entry) => (
              <div
                key={entry.rate}
                className="bg-surface-container-high flex items-center justify-between rounded-lg px-3 py-2"
              >
                <span className="font-geist text-mono-sm text-muted-foreground">
                  {entry.rate}
                </span>
                <span className="text-right">
                  <span className="font-geist text-mono-sm text-foreground block">
                    {formatMoney(entry.gst)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    on {formatMoney(entry.taxable)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
