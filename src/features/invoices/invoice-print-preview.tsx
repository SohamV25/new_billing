"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InvoicePrintDocument } from "@/features/invoices/invoice-print-document";
import type {
  InvoiceCompanyInfo,
  InvoiceDetail,
} from "@/features/invoices/types";

type InvoicePrintPreviewProps = {
  invoice: InvoiceDetail;
  company: InvoiceCompanyInfo;
  autoprint: boolean;
};

export function InvoicePrintPreview({
  invoice,
  company,
  autoprint,
}: InvoicePrintPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoprint) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoprint]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/invoices/${invoice.id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to invoice
        </Link>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>
            <Printer />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="mt-6">
        <InvoicePrintDocument invoice={invoice} company={company} />
      </div>
    </div>
  );
}
