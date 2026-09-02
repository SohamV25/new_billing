import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { duplicateQuotation } from "@/lib/services/quotations";
import { quotationDuplicateSchema } from "@/lib/validations/quotation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
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

    const parsed = quotationDuplicateSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const quotation = await duplicateQuotation(id, parsed.data);
    await logAudit({
      action: "QUOTATION_CREATED",
      entityType: "Quotation",
      entityId: quotation.id,
      metadata: {
        quotationNo: quotation.quotationNo,
        sourceQuotationId: id,
      },
      userId: guard.user.user.id,
    });

    return ok(quotation, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
