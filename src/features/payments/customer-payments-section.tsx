"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";

import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/table-skeleton";
import { formatDate, formatMoney } from "@/lib/format";
import { useCustomerPayments } from "@/features/payments/hooks";
import { PaymentStatusBadge } from "@/features/payments/payment-status-badge";

export function CustomerPaymentsSection({
  customerId,
}: {
  customerId: string;
}) {
  const paymentsQuery = useCustomerPayments(customerId, {
    page: 1,
    pageSize: 10,
  });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-headline-sm text-on-surface font-medium">
          Payments
        </h2>
        <p className="text-body-md text-on-surface-variant mt-0.5">
          Recent payments received from this customer.
        </p>
      </div>

      {paymentsQuery.isPending ? (
        <TableSkeleton columns={5} rows={3} />
      ) : paymentsQuery.isError ? (
        <ErrorState
          message="We couldn't load this customer's payments. Please try again."
          onRetry={() => paymentsQuery.refetch()}
        />
      ) : paymentsQuery.data.items.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No payments yet"
          description="Payments recorded against this customer's invoices will appear here."
        />
      ) : (
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Invoice</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Method</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Amount</DataTableHead>
            </tr>
          </DataTableHeader>
          <tbody>
            {paymentsQuery.data.items.map((payment) => (
              <DataTableRow key={payment.id}>
                <DataTableCell
                  variant="title"
                  className="font-geist text-mono-sm font-medium"
                >
                  <Link
                    href={`/invoices/${payment.invoiceId}`}
                    className="hover:text-primary transition-colors"
                  >
                    {payment.invoiceNo}
                  </Link>
                </DataTableCell>
                <DataTableCell
                  label="Date"
                  className="text-on-surface-variant whitespace-nowrap"
                >
                  {formatDate(payment.paidAt)}
                </DataTableCell>
                <DataTableCell
                  label="Method"
                  className="text-on-surface-variant"
                >
                  {payment.method.replace("_", " ")}
                </DataTableCell>
                <DataTableCell label="Status">
                  <PaymentStatusBadge status={payment.status} />
                </DataTableCell>
                <DataTableCell
                  label="Amount"
                  className="font-geist text-mono-sm text-right font-medium"
                >
                  {formatMoney(payment.amount)}
                </DataTableCell>
              </DataTableRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
