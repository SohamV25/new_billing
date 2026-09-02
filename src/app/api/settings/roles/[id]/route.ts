import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteRole, updateRole } from "@/lib/services/roles";
import { roleUpdateSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  const { id } = await params;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = roleUpdateSchema.safeParse(body);
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

    const role = await updateRole(id, parsed.data, {
      id: currentUser.user.id,
    });
    return ok(role);
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  const { id } = await params;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return fail(401, "UNAUTHORIZED", "Authentication required.");
    }

    await deleteRole(id, currentUser.user);
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
