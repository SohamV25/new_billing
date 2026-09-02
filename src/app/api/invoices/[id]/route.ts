import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  deleteInvoice,
  getInvoice,
  updateInvoice,
} from "@/lib/services/invoices";
import { invoiceUpdateSchema } from "@/lib/validations/invoice";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    return ok(await getInvoice(id));
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const parsed = invoiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const invoice = await updateInvoice(id, parsed.data, guard.user.user.id);
    await logAudit({
      action: "INVOICE_UPDATED",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNo: invoice.invoiceNo },
      userId: guard.user.user.id,
    });

    return ok(invoice);
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    const invoice = await getInvoice(id);
    await deleteInvoice(id);
    await logAudit({
      action: "INVOICE_DELETED",
      entityType: "Invoice",
      entityId: id,
      metadata: { invoiceNo: invoice.invoiceNo },
      userId: guard.user.user.id,
    });

    return ok({ id });
  } catch (error) {
    return fromError(error);
  }
}
