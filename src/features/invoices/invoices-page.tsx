"use client";

import { PageHeader } from "@/components/page-header";
import { InvoicesView } from "@/features/invoices/invoices-view";

export function InvoicesPage() {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create and manage invoices for your customers."
      />
      <InvoicesView />
    </>
  );
}
