import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { deletePayment, updatePayment } from "@/lib/services/payments";
import { paymentUpdateSchema } from "@/lib/validations/payment";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; paymentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id, paymentId } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = paymentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const payment = await updatePayment(id, paymentId, parsed.data);
    await logAudit({
      action: "PAYMENT_UPDATED",
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id, paymentId } = await context.params;

    const deleted = await deletePayment(id, paymentId);
    await logAudit({
      action: "PAYMENT_DELETED",
      entityType: "Invoice",
      entityId: id,
      metadata: {
        paymentId: deleted.id,
        invoiceId: id,
        amount: deleted.amount,
        method: deleted.method,
      },
      userId: guard.user.user.id,
    });

    return ok({ id: deleted.id, invoiceId: id });
  } catch (error) {
    return fromError(error);
  }
}
