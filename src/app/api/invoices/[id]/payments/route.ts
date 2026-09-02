import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { addPayment, listPayments } from "@/lib/services/invoices";
import { paymentCreateSchema } from "@/lib/validations/payment";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    return ok(await listPayments(id));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = paymentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const payment = await addPayment(id, parsed.data, guard.user.user.id);
    await logAudit({
      action: "INVOICE_PAYMENT_RECEIVED",
      entityType: "Invoice",
      entityId: id,
      metadata: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
      },
      userId: guard.user.user.id,
    });

    return ok(payment, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
