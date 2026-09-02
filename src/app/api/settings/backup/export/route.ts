import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { exportSnapshot } from "@/lib/services/backup";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const snapshot = await exportSnapshot();
    await logAudit({
      action: "BACKUP_EXPORTED",
      entityType: "Backup",
      userId: guard.user.user.id,
    });

    const body = JSON.stringify(snapshot, null, 2);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString()}.json"`,
      },
    });
  } catch (error) {
    return fromError(error);
  }
}
