"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Pencil,
  Printer,
  ReceiptText,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/error-state";
import { formatDate, formatMoney } from "@/lib/format";
import { trimNumber } from "@/lib/helpers";
import {
  useConvertQuotation,
  useDeleteQuotation,
  useDuplicateQuotation,
  useQuotation,
} from "@/features/quotations/hooks";
import { QuotationFormDialog } from "@/features/quotations/quotation-form-dialog";
import { QuotationStatusBadge } from "@/features/quotations/quotation-status-badge";
import type { QuotationItemDetail } from "@/features/quotations/types";

export type CompanyPrintInfo = {
  companyName: string;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
};

type QuotationDetailPageProps = {
  quotationId: string;
  company: CompanyPrintInfo;
};

function taxLabel(item: QuotationItemDetail): string {
  if (Number(item.igstRate) > 0) {
    return `IGST ${trimNumber(item.igstRate)}%`;
  }
  return `CGST ${trimNumber(item.cgstRate)}% + SGST ${trimNumber(item.sgstRate)}%`;
}

export function QuotationDetailPage({
  quotationId,
  company,
}: QuotationDetailPageProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const quotationQuery = useQuotation(quotationId);
  const deleteQuotation = useDeleteQuotation();
  const duplicateQuotation = useDuplicateQuotation();
  const convertQuotation = useConvertQuotation();

  if (quotationQuery.isPending) {
    return (
      <>
        <BackLink />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </>
    );
  }

  if (quotationQuery.isError || !quotationQuery.data) {
    return (
      <>
        <BackLink />
        <div className="mt-4">
          <ErrorState
            title="Quotation not found"
            message="We couldn't load this quotation. It may have been deleted, or the link may be incorrect."
          />
        </div>
      </>
    );
  }

  const quotation = quotationQuery.data;
  const canConvert = !["EXPIRED", "REJECTED", "CONVERTED"].includes(
    quotation.status
  );
  const customer = quotation.customer;

  async function handleDuplicate() {
    const result = await duplicateQuotation.mutateAsync({
      id: quotationId,
      input: { status: "DRAFT" },
    });
    router.push(`/quotations/${result.id}`);
  }

  async function handleDelete() {
    await deleteQuotation.mutateAsync(quotationId);
    setDeleteOpen(false);
    router.push("/quotations");
  }

  async function handleConvert() {
    await convertQuotation.mutateAsync({ id: quotationId, input: {} });
    setConvertOpen(false);
  }

  const customerLocation = [customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(", ");
  const companyLocation = [company.city, company.state, company.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <BackLink />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="font-geist text-mono-sm text-on-surface font-semibold">
            {quotation.quotationNo}
          </h1>
          <QuotationStatusBadge status={quotation.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            aria-label="Print quotation"
          >
            <Printer />
            Print
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy />
            Duplicate
          </Button>
          {canConvert ? (
            <Button onClick={() => setConvertOpen(true)}>
              <ReceiptText />
              Convert to invoice
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => setFormOpen(true)}
            disabled={quotation.status === "CONVERTED"}
          >
            <Pencil />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-error hover:bg-error/10 hover:text-error"
            onClick={() => setDeleteOpen(true)}
            disabled={quotation.status === "CONVERTED"}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <div data-print-area className="mt-6 space-y-4">
        {/* Header card */}
        <section className="border-border bg-surface-card rounded-xl border p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
                  Quotation
                </p>
                <h2 className="text-headline-md text-on-surface font-semibold tracking-tight">
                  {quotation.quotationNo}
                </h2>
                <p className="text-body-md text-on-surface-variant">
                  Issued {formatDate(quotation.date)}
                  {quotation.validUntil
                    ? ` · Valid until ${formatDate(quotation.validUntil)}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
                  Total Amount
                </p>
                <p className="text-headline-md text-primary mt-1">
                  {formatMoney(quotation.totalAmount)}
                </p>
              </div>
            </div>

            <div className="border-border grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div>
                <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
                  Bill To
                </p>
                <p className="text-body-lg text-on-surface mt-1 font-medium">
                  {customer.name}
                </p>
                {customer.address ? (
                  <p className="text-body-md text-on-surface-variant">
                    {customer.address}
                  </p>
                ) : null}
                {customerLocation ? (
                  <p className="text-body-md text-on-surface-variant">
                    {customerLocation}
                  </p>
                ) : null}
                {customer.phone ? (
                  <p className="font-geist text-mono-sm text-on-surface-variant mt-1">
                    {customer.phone}
                  </p>
                ) : null}
                {customer.email ? (
                  <p className="text-body-md text-on-surface-variant">
                    {customer.email}
                  </p>
                ) : null}
                {customer.gstin ? (
                  <p className="font-geist text-mono-sm text-on-surface-variant">
                    GSTIN: {customer.gstin}
                  </p>
                ) : null}
              </div>
              <div className="sm:text-right">
                <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
                  From
                </p>
                <p className="text-body-lg text-on-surface mt-1 font-medium">
                  {company.companyName}
                </p>
                {company.address ? (
                  <p className="text-body-md text-on-surface-variant">
                    {company.address}
                  </p>
                ) : null}
                {companyLocation ? (
                  <p className="text-body-md text-on-surface-variant">
                    {companyLocation}
                  </p>
                ) : null}
                {company.phone ? (
                  <p className="font-geist text-mono-sm text-on-surface-variant mt-1">
                    {company.phone}
                  </p>
                ) : null}
                {company.email ? (
                  <p className="text-body-md text-on-surface-variant">
                    {company.email}
                  </p>
                ) : null}
                {company.gstin ? (
                  <p className="font-geist text-mono-sm text-on-surface-variant">
                    GSTIN: {company.gstin}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Line items */}
        <section className="border-border bg-surface-card overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="font-geist text-mono-sm text-on-surface-variant px-4 py-3 tracking-wider uppercase">
                    Description
                  </th>
                  <th className="font-geist text-mono-sm text-on-surface-variant px-4 py-3 tracking-wider uppercase">
                    Qty
                  </th>
                  <th className="font-geist text-mono-sm text-on-surface-variant px-4 py-3 text-right tracking-wider uppercase">
                    Rate
                  </th>
                  <th className="font-geist text-mono-sm text-on-surface-variant px-4 py-3 text-right tracking-wider uppercase">
                    GST
                  </th>
                  <th className="font-geist text-mono-sm text-on-surface-variant px-4 py-3 text-right tracking-wider uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {quotation.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <p className="text-body-md text-on-surface">
                        {item.description}
                      </p>
                      {item.hsn ? (
                        <p className="text-on-surface-variant text-xs">
                          HSN {item.hsn}
                        </p>
                      ) : null}
                    </td>
                    <td className="font-geist text-mono-sm text-on-surface px-4 py-4">
                      {trimNumber(item.quantity)}
                    </td>
                    <td className="font-geist text-mono-sm text-on-surface px-4 py-4 text-right">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="font-geist text-mono-sm text-on-surface-variant px-4 py-4 text-right">
                      {taxLabel(item)}
                    </td>
                    <td className="font-geist text-mono-sm text-on-surface px-4 py-4 text-right">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Totals + notes */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="border-border bg-surface-card rounded-xl border p-6 lg:col-span-1">
            <div className="text-body-md text-on-surface-variant flex justify-between">
              <span>Subtotal</span>
              <span className="font-geist text-mono-sm text-on-surface">
                {formatMoney(quotation.subTotal)}
              </span>
            </div>
            {Number(quotation.totalCgst) > 0 ? (
              <div className="text-body-md text-on-surface-variant mt-2 flex justify-between">
                <span>CGST</span>
                <span className="font-geist text-mono-sm text-on-surface">
                  {formatMoney(quotation.totalCgst)}
                </span>
              </div>
            ) : null}
            {Number(quotation.totalSgst) > 0 ? (
              <div className="text-body-md text-on-surface-variant mt-2 flex justify-between">
                <span>SGST</span>
                <span className="font-geist text-mono-sm text-on-surface">
                  {formatMoney(quotation.totalSgst)}
                </span>
              </div>
            ) : null}
            {Number(quotation.totalIgst) > 0 ? (
              <div className="text-body-md text-on-surface-variant mt-2 flex justify-between">
                <span>IGST</span>
                <span className="font-geist text-mono-sm text-on-surface">
                  {formatMoney(quotation.totalIgst)}
                </span>
              </div>
            ) : null}
            <div className="bg-outline-variant my-3 h-px" />
            <div className="text-body-lg text-on-surface flex justify-between font-semibold">
              <span>Total</span>
              <span className="font-geist text-mono-sm">
                {formatMoney(quotation.totalAmount)}
              </span>
            </div>
          </div>

          {quotation.notes ? (
            <div className="border-border bg-surface-card rounded-xl border p-6 lg:col-span-2">
              <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
                Notes & terms
              </p>
              <p className="text-body-md text-on-surface mt-2 whitespace-pre-wrap">
                {quotation.notes}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <QuotationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        quotationId={quotationId}
        companyState={company.state}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete quotation"
        description={`Delete "${quotation.quotationNo}"? This will permanently remove the quotation and its line items.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        title="Convert to invoice"
        description={`Convert "${quotation.quotationNo}" into a PENDING invoice? The quotation will be marked as converted and its line items and totals will be copied to the new invoice.`}
        confirmLabel="Convert"
        onConfirm={handleConvert}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/quotations"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm print:hidden"
    >
      <ArrowLeft className="size-4" />
      Back to quotations
    </Link>
  );
}
