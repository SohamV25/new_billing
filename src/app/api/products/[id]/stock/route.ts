import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { adjustInventory } from "@/lib/services/inventory";
import { inventoryAdjustSchema } from "@/lib/validations/inventory";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = inventoryAdjustSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const result = await adjustInventory(id, parsed.data, guard.user.user.id);
    await logAudit({
      action: "INVENTORY_ADJUSTMENT",
      entityType: "Product",
      entityId: result.productId,
      metadata: {
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        newQuantity: result.quantity,
      },
      userId: guard.user.user.id,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
