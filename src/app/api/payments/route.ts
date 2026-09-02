import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { listAllPayments } from "@/lib/services/payments";
import { paymentListQuerySchema } from "@/lib/validations/payment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.INVOICES_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const parsed = paymentListQuerySchema.safeParse({
      method: request.nextUrl.searchParams.get("method") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const page = parsed.data.page ?? 1;
    const pageSize = Math.min(200, Math.max(1, parsed.data.pageSize ?? 10));

    return ok(
      await listAllPayments({
        search: parsed.data.search ?? "",
        method: parsed.data.method ?? null,
        status: parsed.data.status ?? null,
        page,
        pageSize,
      })
    );
  } catch (error) {
    return fromError(error);
  }
}
