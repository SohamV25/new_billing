import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  deleteQuotation,
  getQuotation,
  updateQuotation,
} from "@/lib/services/quotations";
import { quotationUpdateSchema } from "@/lib/validations/quotation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.QUOTATIONS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    return ok(await getQuotation(id));
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.QUOTATIONS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = quotationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const quotation = await updateQuotation(id, parsed.data);
    await logAudit({
      action: "QUOTATION_UPDATED",
      entityType: "Quotation",
      entityId: quotation.id,
      metadata: { quotationNo: quotation.quotationNo },
      userId: guard.user.user.id,
    });

    return ok(quotation);
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.QUOTATIONS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    const quotation = await getQuotation(id);
    await deleteQuotation(id);
    await logAudit({
      action: "QUOTATION_DELETED",
      entityType: "Quotation",
      entityId: id,
      metadata: { quotationNo: quotation.quotationNo },
      userId: guard.user.user.id,
    });

    return ok({ id });
  } catch (error) {
    return fromError(error);
  }
}
