import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { importSnapshot } from "@/lib/services/backup";
import type { BackupSnapshot } from "@/lib/services/backup";

export const dynamic = "force-dynamic";

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

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return fail(401, "UNAUTHORIZED", "Authentication required.");
    }

    await importSnapshot(body as BackupSnapshot, {
      id: currentUser.user.id,
      name: currentUser.user.name,
      email: currentUser.user.email,
      image: currentUser.user.image ?? null,
      emailVerified: currentUser.user.emailVerified,
      roleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
