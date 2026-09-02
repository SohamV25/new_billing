import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { getDashboardData } from "@/lib/services/dashboard";
import { dashboardQueryFromParams } from "@/lib/validations/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.DASHBOARD_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const parsed = dashboardQueryFromParams(request.nextUrl.searchParams);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    return ok(await getDashboardData(parsed.data));
  } catch (error) {
    return fromError(error);
  }
}
