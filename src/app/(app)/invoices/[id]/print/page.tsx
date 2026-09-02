import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getInvoice } from "@/lib/services/invoices";
import { InvoicePrintPreview } from "@/features/invoices/invoice-print-preview";
import type { InvoiceCompanyInfo } from "@/features/invoices/types";

export const dynamic = "force-dynamic";

export default async function InvoicePrintRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { id } = await params;
  const { autoprint } = await searchParams;
  await requireUser();

  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });

  const company: InvoiceCompanyInfo = {
    companyName: settings?.companyName ?? "Stitch Billing",
    logoUrl: settings?.logoUrl ?? null,
    gstin: settings?.gstin ?? null,
    address: settings?.address ?? null,
    city: settings?.city ?? null,
    state: settings?.state ?? null,
    pincode: settings?.pincode ?? null,
    phone: settings?.phone ?? null,
    email: settings?.email ?? null,
    website: settings?.website ?? null,
  };

  let invoice: Awaited<ReturnType<typeof getInvoice>> | null = null;
  try {
    invoice = await getInvoice(id);
  } catch {
    invoice = null;
  }

  if (!invoice) {
    return (
      <div className="mt-8 text-center">
        <p className="text-body-md text-on-surface-variant">
          Invoice not found.
        </p>
      </div>
    );
  }

  return (
    <InvoicePrintPreview
      invoice={invoice}
      company={company}
      autoprint={autoprint === "1"}
    />
  );
}
