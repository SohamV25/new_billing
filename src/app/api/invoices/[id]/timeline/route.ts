import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fromError, ok, requireApiPermission } from "@/lib/api";
import { listInvoiceTimeline } from "@/lib/services/invoices";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    return ok(await listInvoiceTimeline(id));
  } catch (error) {
    return fromError(error);
  }
}
