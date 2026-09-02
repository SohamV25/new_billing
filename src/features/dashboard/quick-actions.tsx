"use client";

import { useState } from "react";
import {
  Plus,
  Users,
  Package,
  CreditCard,
  FileText,
  Upload,
  ShoppingCart,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvoiceFormDialog } from "@/features/invoices/invoice-form-dialog";
import { CustomerFormDialog } from "@/features/customers/customer-form-dialog";
import { ProductFormDialog } from "@/features/products/product-form-dialog";
import { PaymentFormDialog } from "@/features/invoices/payment-form-dialog";
import { useInvoices } from "@/features/invoices/hooks";
import { EntityCombobox } from "@/components/entity-combobox";
import { formatMoney } from "@/lib/format";
import { TonalCard } from "@/components/tonal-card";

type UnpaidInvoiceOption = {
  id: string;
  label: string;
  sublabel: string;
  outstanding: string;
};

type QuickActionCardProps = {
  title: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  recentItems?: { label: string; value: string }[];
};

function QuickActionCard({
  title,
  icon,
  actionLabel,
  onAction,
  recentItems,
}: QuickActionCardProps) {
  return (
    <TonalCard padding="md" className="hover:border-primary/30">
      <div className="flex items-center justify-between">
        <h3 className="text-on-surface text-sm font-semibold">{title}</h3>
        <div className="border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-primary/10 flex size-10 items-center justify-center rounded-full border transition-colors">
          <ArrowUpRight className="text-primary size-5" />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-primary/10 hover:text-primary mt-4 gap-2"
        onClick={onAction}
      >
        <Plus className="size-4" />
        {actionLabel}
      </Button>

      {recentItems && recentItems.length > 0 && (
        <div className="mt-4">
          <p className="text-on-surface-variant mb-2 text-xs font-medium tracking-wider uppercase">
            Recent
          </p>
          <ul className="space-y-2">
            {recentItems.slice(0, 3).map((item, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">{item.label}</span>
                <span className="text-on-surface-variant">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </TonalCard>
  );
}

export function QuickActions() {
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<UnpaidInvoiceOption | null>(null);

  const { data: invoicesData } = useInvoices({
    search: "",
    status: "PENDING",
    page: 1,
    pageSize: 200,
  });

  const unpaidInvoices: UnpaidInvoiceOption[] = (invoicesData?.items ?? [])
    .filter((inv) => Number(inv.balance) > 0)
    .map((inv) => ({
      id: inv.id,
      label: inv.invoiceNo,
      sublabel: `${inv.customer.name} · ${formatMoney(inv.balance)}`,
      outstanding: inv.balance,
    }));

  const recentInvoices = unpaidInvoices.slice(0, 3).map((inv) => ({
    label: inv.label,
    value: inv.sublabel.split(" · ")[1] || "",
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <InvoiceFormDialog
          open={createInvoiceOpen}
          onOpenChange={setCreateInvoiceOpen}
          invoiceId={null}
        />
        <CustomerFormDialog
          open={addCustomerOpen}
          onOpenChange={setAddCustomerOpen}
          customer={null}
        />
        <ProductFormDialog
          open={addProductOpen}
          onOpenChange={setAddProductOpen}
          product={null}
        />

        <QuickActionCard
          title="Invoices"
          icon={<FileText className="text-primary size-5" />}
          actionLabel="Create New"
          onAction={() => setCreateInvoiceOpen(true)}
          recentItems={recentInvoices}
        />

        <QuickActionCard
          title="Customers"
          icon={<Users className="text-primary size-5" />}
          actionLabel="Add Customer"
          onAction={() => setAddCustomerOpen(true)}
        />

        <QuickActionCard
          title="Products"
          icon={<Package className="text-primary size-5" />}
          actionLabel="Add Item"
          onAction={() => setAddProductOpen(true)}
        />

        <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <QuickActionCard
                title="Payments"
                icon={<CreditCard className="text-primary size-5" />}
                actionLabel="Record Payment"
                onAction={() => setRecordPaymentOpen(true)}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="border-outline-variant bg-surface-container max-w-md">
            <DialogHeader>
              <DialogTitle className="text-on-surface">
                Record Payment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <EntityCombobox
                options={unpaidInvoices}
                value={selectedInvoice?.id ?? ""}
                onChange={(id) => {
                  const invoice = unpaidInvoices.find((inv) => inv.id === id);
                  setSelectedInvoice(invoice ?? null);
                }}
                placeholder="Select an unpaid invoice"
                isLoading={!invoicesData}
              />
              {selectedInvoice && (
                <PaymentFormDialog
                  open={true}
                  onOpenChange={(open) => {
                    if (!open) {
                      setRecordPaymentOpen(false);
                      setSelectedInvoice(null);
                    }
                  }}
                  invoiceId={selectedInvoice.id}
                  outstanding={selectedInvoice.outstanding}
                  payment={null}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
