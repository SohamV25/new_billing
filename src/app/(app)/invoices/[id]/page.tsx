import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { InvoiceDetailPage } from "@/features/invoices/invoice-detail-page";
import type { InvoiceCompanyInfo } from "@/features/invoices/invoice-print-document";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  return <InvoiceDetailPage invoiceId={id} company={company} />;
}
