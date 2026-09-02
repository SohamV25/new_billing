"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileDown,
  HandCoins,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/table-skeleton";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  useCancelInvoice,
  useDeleteInvoice,
  useDeletePayment,
  useInvoice,
  useInvoicePayments,
  useRefundPayment,
} from "@/features/invoices/hooks";
import { InvoiceFormDialog } from "@/features/invoices/invoice-form-dialog";
import { InvoicePrintDocument } from "@/features/invoices/invoice-print-document";
import { downloadInvoicePdf } from "@/lib/download-invoice-pdf";
import { InvoiceStatusBadge } from "@/features/invoices/invoice-status-badge";
import { InvoiceTimeline } from "@/features/invoices/invoice-timeline";
import { PaymentFormDialog } from "@/features/invoices/payment-form-dialog";
import { PaymentStatusBadge } from "@/features/payments/payment-status-badge";
import type {
  InvoiceCompanyInfo,
  PaymentDetail,
} from "@/features/invoices/types";
import { TonalCard } from "@/components/tonal-card";

const PAYMENT_METHOD_LABELS: Record<PaymentDetail["method"], string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
};

type InvoiceDetailPageProps = {
  invoiceId: string;
  company: InvoiceCompanyInfo;
};

function PaymentsSection({
  invoiceId,
  canRecordPayment,
  onRecordPayment,
  outstanding,
}: {
  invoiceId: string;
  canRecordPayment: boolean;
  onRecordPayment: () => void;
  outstanding: string;
}) {
  const paymentsQuery = useInvoicePayments(invoiceId);
  const refundPayment = useRefundPayment();
  const deletePayment = useDeletePayment();

  const [editTarget, setEditTarget] = useState<PaymentDetail | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaymentDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentDetail | null>(null);

  const payments = paymentsQuery.data ?? [];

  async function handleRefund() {
    if (!refundTarget) return;
    await refundPayment.mutateAsync({
      id: invoiceId,
      paymentId: refundTarget.id,
    });
    setRefundTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deletePayment.mutateAsync({
      id: invoiceId,
      paymentId: deleteTarget.id,
    });
    setDeleteTarget(null);
  }

  const editOutstanding = editTarget
    ? (Number(outstanding) + Number(editTarget.amount)).toFixed(2)
    : outstanding;

  return (
    <TonalCard
      as="section"
      variant="sunken"
      padding="none"
      className="overflow-hidden"
    >
      <div className="border-outline-variant flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h3 className="text-on-surface text-lg font-medium">Payments</h3>
          <p className="text-on-surface-variant mt-0.5 text-sm">
            Payment history and outstanding balance for this invoice.
          </p>
        </div>
        {canRecordPayment ? (
          <Button onClick={onRecordPayment}>
            <HandCoins />
            Record payment
          </Button>
        ) : null}
      </div>

      {paymentsQuery.isPending ? (
        <TableSkeleton columns={5} rows={3} />
      ) : paymentsQuery.isError ? (
        <ErrorState
          message="We couldn't load this invoice's payments. Please try again."
          onRetry={() => paymentsQuery.refetch()}
        />
      ) : payments.length === 0 ? (
        <p className="text-on-surface-variant px-6 py-6 text-sm">
          No payments recorded yet.
        </p>
      ) : (
        <DataTable className="rounded-none border-0">
          <DataTableHeader>
            <tr>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Method</DataTableHead>
              <DataTableHead>Reference</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Recorded by</DataTableHead>
              <DataTableHead className="text-right">Amount</DataTableHead>
              <DataTableHead className="w-12" />
            </tr>
          </DataTableHeader>
          <tbody>
            {payments.map((payment) => (
              <DataTableRow key={payment.id}>
                <DataTableCell
                  variant="title"
                  className="text-on-surface font-medium whitespace-nowrap"
                >
                  {formatDateTime(payment.paidAt)}
                </DataTableCell>
                <DataTableCell label="Method" className="text-on-surface">
                  {PAYMENT_METHOD_LABELS[payment.method]}
                </DataTableCell>
                <DataTableCell
                  label="Reference"
                  className="text-on-surface-variant"
                >
                  {payment.reference ?? "—"}
                </DataTableCell>
                <DataTableCell label="Status">
                  <PaymentStatusBadge status={payment.status} />
                </DataTableCell>
                <DataTableCell
                  label="Recorded by"
                  className="text-on-surface-variant"
                >
                  {payment.user.name}
                </DataTableCell>
                <DataTableCell
                  label="Amount"
                  className="text-on-surface text-right font-medium tabular-nums"
                >
                  {formatMoney(payment.amount)}
                </DataTableCell>
                <DataTableCell variant="actions">
                  {payment.status === "COMPLETED" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Payment actions"
                          className="text-on-surface-variant hover:text-primary max-md:size-9"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditTarget(payment)}
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRefundTarget(payment)}
                        >
                          <RotateCcw />
                          Refund
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(payment)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </DataTableCell>
              </DataTableRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <PaymentFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        invoiceId={invoiceId}
        outstanding={editOutstanding}
        payment={editTarget}
      />
      <ConfirmDialog
        open={refundTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRefundTarget(null);
        }}
        title="Refund payment"
        description={`Refund ${formatMoney(refundTarget?.amount ?? "")} recorded against this invoice? The refunded amount will be excluded from the paid balance and the invoice status will be updated.`}
        confirmLabel="Refund"
        onConfirm={handleRefund}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete payment"
        description={`Permanently delete this ${formatMoney(deleteTarget?.amount ?? "")} payment? The invoice status will be recalculated from the remaining payments.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </TonalCard>
  );
}

export function InvoiceDetailPage({
  invoiceId,
  company,
}: InvoiceDetailPageProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const invoiceQuery = useInvoice(invoiceId);
  const deleteInvoice = useDeleteInvoice();
  const cancelInvoice = useCancelInvoice();

  if (invoiceQuery.isPending) {
    return (
      <>
        <BackLink />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </>
    );
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <>
        <BackLink />
        <div className="mt-4">
          <ErrorState
            title="Invoice not found"
            message="We couldn't load this invoice. It may have been deleted, or the link may be incorrect."
          />
        </div>
      </>
    );
  }

  const invoice = invoiceQuery.data;
  const isDraft = invoice.status === "DRAFT";
  // Editable until money has been collected against it.
  const canEdit =
    (invoice.status === "DRAFT" ||
      invoice.status === "PENDING" ||
      invoice.status === "OVERDUE") &&
    invoice.balance === invoice.totalAmount;
  const canRecordPayment =
    invoice.status === "PENDING" ||
    invoice.status === "PARTIALLY_PAID" ||
    invoice.status === "OVERDUE";
  const canCancel =
    (invoice.status === "PENDING" || invoice.status === "OVERDUE") &&
    invoice.balance === invoice.totalAmount;

  async function handleDelete() {
    await deleteInvoice.mutateAsync(invoiceId);
    setDeleteOpen(false);
    router.push("/invoices");
  }

  async function handleCancel() {
    await cancelInvoice.mutateAsync(invoiceId);
    setCancelOpen(false);
  }

  async function handleDownloadPdf() {
    if (!printAreaRef.current) return;
    await downloadInvoicePdf(
      printAreaRef.current,
      invoice.invoiceNo,
      invoice.customer.name
    );
  }

  return (
    <>
      <BackLink />

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="font-geist text-mono-sm text-on-surface font-semibold">
            {invoice.invoiceNo}
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            className="border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high"
          >
            <FileDown />
            Download PDF
          </Button>
          {canRecordPayment ? (
            <Button onClick={() => setPaymentOpen(true)}>
              <HandCoins />
              Record payment
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => setFormOpen(true)}
            disabled={!canEdit}
            className="border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high"
          >
            <Pencil />
            Edit
          </Button>
          {canCancel ? (
            <Button
              variant="outline"
              className="border-error/30 text-error hover:bg-error/10 hover:text-error"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle />
              Cancel
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="border-error/30 text-error hover:bg-error/10 hover:text-error"
            onClick={() => setDeleteOpen(true)}
            disabled={!isDraft}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <div ref={printAreaRef} className="mt-6">
        <InvoicePrintDocument invoice={invoice} company={company} />
      </div>

      <div className="mt-4 space-y-4 print:hidden">
        <PaymentsSection
          invoiceId={invoiceId}
          canRecordPayment={canRecordPayment}
          onRecordPayment={() => setPaymentOpen(true)}
          outstanding={invoice.balance}
        />
        <InvoiceTimeline invoiceId={invoiceId} />
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoiceId={invoiceId}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete invoice"
        description={`Delete "${invoice.invoiceNo}"? This will permanently remove the invoice and its line items.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel invoice"
        description={`Cancel "${invoice.invoiceNo}"? The deducted stock will be restored and the invoice will no longer be collectable.`}
        confirmLabel="Cancel"
        destructive
        onConfirm={handleCancel}
      />
      <PaymentFormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        invoiceId={invoiceId}
        outstanding={invoice.balance}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/invoices"
      className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 text-sm print:hidden"
    >
      <ArrowLeft className="size-4" />
      Back to invoices
    </Link>
  );
}
