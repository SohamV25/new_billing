"use client";

import { ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";

/**
 * Placeholder for a customer's activity history. Once billing is implemented,
 * this will render the customer's invoices and quotations. Kept as a separate
 * component so the future billing sprint can replace it in one place.
 */
export function CustomerActivity() {
  return (
    <EmptyState
      icon={ReceiptText}
      title="No activity yet"
      description="Invoices and quotations for this customer will appear here once billing is live."
    />
  );
}
