import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { refundPayment } from "@/lib/services/payments";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; paymentId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id, paymentId } = await context.params;

    const payment = await refundPayment(id, paymentId);
    await logAudit({
      action: "PAYMENT_REFUNDED",
      entityType: "Invoice",
      entityId: id,
      metadata: {
        paymentId: payment.id,
        invoiceId: id,
        amount: payment.amount,
        method: payment.method,
      },
      userId: guard.user.user.id,
    });

    return ok(payment);
  } catch (error) {
    return fromError(error);
  }
}
