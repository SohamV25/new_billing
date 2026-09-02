"use client";

import { PageHeader } from "@/components/page-header";
import { PaymentsView } from "@/features/payments/payments-view";

export function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Payments"
        description="Search and review every payment received across your invoices."
      />
      <PaymentsView />
    </>
  );
}
