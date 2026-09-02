import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import {
  fail,
  fromError,
  getPaginationParams,
  ok,
  requireApiPermission,
} from "@/lib/api";
import { listInventory } from "@/lib/services/inventory";
import { stockStatusFilterSchema } from "@/lib/validations/inventory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    const statusRaw = request.nextUrl.searchParams.get("status") ?? "all";

    const status = stockStatusFilterSchema.safeParse(statusRaw);
    if (!status.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Invalid stock status filter.",
        status.error.issues
      );
    }

    return ok(
      await listInventory({
        search,
        page,
        pageSize,
        status: status.data,
      })
    );
  } catch (error) {
    return fromError(error);
  }
}
