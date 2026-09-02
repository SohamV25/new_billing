import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { duplicateInvoice } from "@/lib/services/invoices";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    const invoice = await duplicateInvoice(id, guard.user.user.id);
    await logAudit({
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { invoiceNo: invoice.invoiceNo },
      userId: guard.user.user.id,
    });

    return ok(invoice, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
