import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  QuotationDetailPage,
  type CompanyPrintInfo,
} from "@/features/quotations/quotation-detail-page";

export const dynamic = "force-dynamic";

export default async function QuotationDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();

  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });

  const company: CompanyPrintInfo = {
    companyName: settings?.companyName ?? "Stitch Billing",
    gstin: settings?.gstin ?? null,
    address: settings?.address ?? null,
    city: settings?.city ?? null,
    state: settings?.state ?? null,
    pincode: settings?.pincode ?? null,
    phone: settings?.phone ?? null,
    email: settings?.email ?? null,
    website: settings?.website ?? null,
  };

  return <QuotationDetailPage quotationId={id} company={company} />;
}
