import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { runReport } from "@/lib/services/reports";
import { reportQueryFromParams } from "@/lib/validations/report";

export const dynamic = "force-dynamic";

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

    const page = parsed.data.page ?? 1;
    const pageSize = Math.min(200, Math.max(1, parsed.data.pageSize ?? 10));

    return ok(await runReport(parsed.data, { page, pageSize }));
  } catch (error) {
    return fromError(error);
  }
}
