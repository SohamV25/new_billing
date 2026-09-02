import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import {
  fail,
  fromError,
  getPaginationParams,
  ok,
  requireApiPermission,
} from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  listQuotations,
  type QuotationStatusOption,
} from "@/lib/services/quotations";
import { createQuotation } from "@/lib/services/quotations";
import { quotationCreateSchema } from "@/lib/validations/quotation";

export const dynamic = "force-dynamic";

const QUOTATION_STATUSES = new Set<string>([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.QUOTATIONS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    const rawStatus = request.nextUrl.searchParams.get("status")?.trim() ?? "";
    if (rawStatus && !QUOTATION_STATUSES.has(rawStatus)) {
      return fail(422, "VALIDATION_ERROR", "Unknown quotation status filter.", {
        status: rawStatus,
      });
    }
    const status = (rawStatus || null) as QuotationStatusOption | null;

    return ok(await listQuotations({ search, status, page, pageSize }));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.QUOTATIONS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = quotationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const quotation = await createQuotation(parsed.data, guard.user.user.id);
    await logAudit({
      action: "QUOTATION_CREATED",
      entityType: "Quotation",
      entityId: quotation.id,
      metadata: { quotationNo: quotation.quotationNo },
      userId: guard.user.user.id,
    });

    return ok(quotation, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
