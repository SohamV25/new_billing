import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { QuotationsPage } from "@/features/quotations/quotations-page";

export const dynamic = "force-dynamic";

export default async function QuotationsRoute() {
  await requireUser();

  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });

  return <QuotationsPage companyState={settings?.state ?? null} />;
}
