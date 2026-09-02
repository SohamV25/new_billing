import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import {
  fail,
  fromError,
  getPaginationParams,
  ok,
  requireApiPermission,
} from "@/lib/api";
import { listMovements } from "@/lib/services/inventory";
import { movementTypeFilterSchema } from "@/lib/validations/inventory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    const typeRaw = request.nextUrl.searchParams.get("type") ?? "all";

    const type = movementTypeFilterSchema.safeParse(typeRaw);
    if (!type.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Invalid movement type filter.",
        type.error.issues
      );
    }

    return ok(
      await listMovements({
        search,
        page,
        pageSize,
        type: type.data === "all" ? undefined : type.data,
      })
    );
  } catch (error) {
    return fromError(error);
  }
}
