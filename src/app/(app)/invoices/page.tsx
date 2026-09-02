import { requireUser } from "@/lib/auth/current-user";
import { InvoicesPage } from "@/features/invoices/invoices-page";

export const dynamic = "force-dynamic";

export default async function InvoicesRoute() {
  await requireUser();

  return <InvoicesPage />;
}
