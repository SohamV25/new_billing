import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  getCompanySettings,
  updateInvoiceSettings,
} from "@/lib/services/settings";
import { invoiceSettingsSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    return ok(await getCompanySettings());
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.SETTINGS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = invoiceSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const settings = await updateInvoiceSettings(parsed.data);
    await logAudit({
      action: "SETTINGS_CHANGED",
      entityType: "CompanySettings",
      entityId: settings.id,
      metadata: { field: "invoiceSettings" },
      userId: guard.user.user.id,
    });

    return ok(settings);
  } catch (error) {
    return fromError(error);
  }
}
