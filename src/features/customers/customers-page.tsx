"use client";

import { PageHeader } from "@/components/page-header";
import { CustomersView } from "@/features/customers/customers-view";

export function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage your customers, their contact details, and billing history."
      />
      <CustomersView />
    </>
  );
}
