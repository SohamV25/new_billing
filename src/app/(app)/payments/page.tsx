import { requireUser } from "@/lib/auth/current-user";
import { PaymentsPage } from "@/features/payments/payments-page";

export const dynamic = "force-dynamic";

export default async function PaymentsRoute() {
  await requireUser();

  return <PaymentsPage />;
}
