import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import {
  fail,
  fromError,
  getPaginationParams,
  ok,
  requireApiPermission,
} from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  createInvoice,
  finalizeInvoice,
  listInvoices,
  type InvoiceStatusOption,
} from "@/lib/services/invoices";
import { invoiceCreateSchema } from "@/lib/validations/invoice";

export const dynamic = "force-dynamic";

const INVOICE_STATUSES = new Set<string>([
  "DRAFT",
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "VOID",
]);

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    const rawStatus = request.nextUrl.searchParams.get("status")?.trim() ?? "";
    if (rawStatus && !INVOICE_STATUSES.has(rawStatus)) {
      return fail(422, "VALIDATION_ERROR", "Unknown invoice status filter.", {
        status: rawStatus,
      });
    }
    const status = (rawStatus || null) as InvoiceStatusOption | null;

    return ok(await listInvoices({ search, status, page, pageSize }));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = invoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const draft = await createInvoice(parsed.data, guard.user.user.id);
    await logAudit({
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: draft.id,
      metadata: { invoiceNo: draft.invoiceNo },
      userId: guard.user.user.id,
    });

    // Invoices are always issued on creation — there is no manual finalize step.
    // The draft is left in place if issuing fails (e.g. insufficient stock) so
    // the work is not lost and it can be corrected and finalized by hand.
    const invoice = await finalizeInvoice(draft.id, guard.user.user.id);
    await logAudit({
      action: "INVOICE_FINALIZED",
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
