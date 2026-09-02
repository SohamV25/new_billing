import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { listAuditLog } from "@/lib/services/settings";
import { auditLogQuerySchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action")?.trim() || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, Number(searchParams.get("pageSize")) || 10)
    );

    return ok(
      await listAuditLog({
        action: action as
          import("@/generated/prisma/client").AuditAction | undefined,
        search,
        page,
        pageSize,
      })
    );
  } catch (error) {
    return fromError(error);
  }
}
