import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { convertQuotation } from "@/lib/services/quotations";
import { quotationConvertSchema } from "@/lib/validations/quotation";

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

    const parsed = quotationConvertSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const result = await convertQuotation(id, parsed.data, guard.user.user.id);
    await logAudit({
      action: "QUOTATION_CONVERTED",
      entityType: "Quotation",
      entityId: result.quotationId,
      metadata: {
        invoiceId: result.invoiceId,
        invoiceNo: result.invoiceNo,
      },
      userId: guard.user.user.id,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
