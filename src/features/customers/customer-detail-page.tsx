"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Pencil, ReceiptText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/error-state";
import { formatDate, formatNumber } from "@/lib/format";
import { CustomerActivity } from "@/features/customers/customer-activity";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { useCustomer, useDeleteCustomer } from "@/features/customers/hooks";
import { CustomerPaymentsSection } from "@/features/payments/customer-payments-section";
import type { CustomerDetail } from "@/features/customers/types";

type DetailRowProps = {
  label: string;
  value: string | null;
  mono?: boolean;
};

function DetailRow({ label, value, mono = false }: DetailRowProps) {
  return (
    <div className="space-y-1">
      <p className="font-geist text-on-surface-variant text-xs font-medium tracking-wider uppercase">
        {label}
      </p>
      <p
        className={
          mono
            ? "font-geist text-on-surface text-xs break-all"
            : "text-on-surface text-sm"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <div className="border-outline-variant/40 bg-surface-card rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <div className="bg-primary-container/10 flex size-8 items-center justify-center rounded-lg">
          <Icon className="text-primary-container size-4" />
        </div>
        <p className="font-geist text-on-surface-variant text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
      </div>
      <p className="text-on-surface mt-2 text-2xl font-semibold tabular-nums">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Skeleton className="h-64 rounded-xl sm:col-span-2" />
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

type CustomerDetailPageProps = {
  customerId: string;
};

export function CustomerDetailPage({ customerId }: CustomerDetailPageProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const customerQuery = useCustomer(customerId);
  const deleteCustomer = useDeleteCustomer();

  function openEdit() {
    setFormOpen(true);
  }

  async function handleDelete() {
    await deleteCustomer.mutateAsync(customerId);
    setDeleteOpen(false);
    router.push("/customers");
  }

  if (customerQuery.isPending) {
    return (
      <>
        <BackLink />
        <div className="mt-4">
          <CustomerSkeleton />
        </div>
      </>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <>
        <BackLink />
        <div className="mt-4">
          <ErrorState
            title="Customer not found"
            message="We couldn't load this customer. It may have been deleted, or the link may be incorrect."
          />
        </div>
      </>
    );
  }

  const customer: CustomerDetail = customerQuery.data;

  return (
    <>
      <BackLink />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-on-surface text-2xl font-semibold tracking-tight sm:text-3xl">
            {customer.name}
          </h1>
          <p className="text-on-surface-variant text-sm">
            Added on {formatDate(customer.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-error-container/40 text-error hover:bg-error/10 hover:text-error"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="border-outline-variant/40 bg-surface-card rounded-xl border p-5 sm:col-span-2">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailRow label="Email" value={customer.email} />
            <DetailRow label="Phone" value={customer.phone} mono />
            <DetailRow label="Address" value={customer.address} />
            <DetailRow label="City" value={customer.city} />
            <DetailRow label="State" value={customer.state} />
            <DetailRow label="Pincode" value={customer.pincode} mono />
            <DetailRow label="GSTIN" value={customer.gstin} mono />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <StatCard
            icon={ReceiptText}
            label="Invoices"
            value={customer.invoiceCount}
          />
          <StatCard
            icon={FileText}
            label="Quotations"
            value={customer.quotationCount}
          />
        </div>
      </div>

      <div className="border-outline-variant/40 bg-surface-card mt-5 overflow-hidden rounded-xl border">
        <div className="border-outline-variant/30 border-b px-4 py-3 sm:px-5">
          <h2 className="text-on-surface text-sm font-medium">Activity</h2>
        </div>
        <div className="p-4">
          <CustomerActivity />
        </div>
      </div>

      <div className="mt-5">
        <CustomerPaymentsSection customerId={customerId} />
      </div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={customer}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete customer"
        description={`Delete "${customer.name}"? ${
          customer.invoiceCount > 0
            ? `This customer has ${formatNumber(customer.invoiceCount)} invoice(s). Their billing history will be preserved, but the customer will no longer appear in active lists.`
            : "Their history will be preserved, but the customer will no longer appear in active lists."
        }`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/customers"
      className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <ArrowLeft className="size-4" />
      Back to customers
    </Link>
  );
}
