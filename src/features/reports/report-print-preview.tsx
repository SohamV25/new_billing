"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReportPrintDocument } from "@/features/reports/report-print-document";
import type { ReportRow } from "@/lib/reports/columns";
import type {
  ReportCompanyInfo,
  ReportMeta,
  ReportSummaryItem,
  ReportType,
} from "./types";

type ReportPrintPreviewProps = {
  type: ReportType;
  rows: ReportRow[];
  summary: ReportSummaryItem[];
  meta?: ReportMeta | null;
  company: ReportCompanyInfo;
  autoprint: boolean;
};

export function ReportPrintPreview({
  type,
  rows,
  summary,
  meta,
  company,
  autoprint,
}: ReportPrintPreviewProps) {
  useEffect(() => {
    if (!autoprint) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoprint]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/reports"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to reports
        </Link>
        <Button onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </div>

      <div data-print-area className="mt-6">
        <ReportPrintDocument
          type={type}
          rows={rows}
          summary={summary}
          meta={meta}
          company={company}
        />
      </div>
    </div>
  );
}
