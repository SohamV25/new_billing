import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { runReport } from "@/lib/services/reports";
import { reportQueryFromParams } from "@/lib/validations/report";

export const dynamic = "force-dynamic";

const EXPORT_ROW_CAP = 10_000;

/**
 * Returns every row matching the query without pagination so the client can
 * generate the full CSV. The row cap guards against unbounded responses while
 * remaining far above any realistic invoice/payment volume.
 */
export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.REPORTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const parsed = reportQueryFromParams(request.nextUrl.searchParams);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const result = await runReport(parsed.data, {
      page: 1,
      pageSize: EXPORT_ROW_CAP,
    });

    return ok({
      rows: result.items,
      summary: result.summary,
      meta: result.meta ?? null,
    });
  } catch (error) {
    return fromError(error);
  }
}
