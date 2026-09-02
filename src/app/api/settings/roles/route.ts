import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createRole, listRoles } from "@/lib/services/roles";
import { roleCreateSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    return ok(await listRoles());
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

    const parsed = roleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return fail(401, "UNAUTHORIZED", "Authentication required.");
    }

    const role = await createRole(parsed.data, currentUser.user);
    return ok(role, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
