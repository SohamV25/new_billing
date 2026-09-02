import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { createUser, listUsers } from "@/lib/services/roles";
import { userCreateSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    return ok(await listUsers({ search, page, pageSize }));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const user = await createUser(parsed.data);
    await logAudit({
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { name: user.name, email: user.email },
      userId: guard.user.user.id,
    });

    return ok(user, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}

function getPaginationParams(request: NextRequest, defaultPageSize = 10) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize")) || defaultPageSize)
  );
  const search = searchParams.get("search")?.trim() ?? "";
  return { search, page, pageSize };
}
