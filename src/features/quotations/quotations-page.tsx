"use client";

import { PageHeader } from "@/components/page-header";
import { QuotationsView } from "@/features/quotations/quotations-view";

type QuotationsPageProps = {
  companyState: string | null;
};

export function QuotationsPage({ companyState }: QuotationsPageProps) {
  return (
    <>
      <PageHeader
        title="Quotations"
        description="Create and manage price estimates for your customers."
      />
      <QuotationsView companyState={companyState} />
    </>
  );
}
