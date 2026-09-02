import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/lib/services/products";
import { productUpdateSchema } from "@/lib/validations/product";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    return ok(await getProduct(id));
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const product = await updateProduct(id, parsed.data);
    await logAudit({
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: product.id,
      metadata: { name: product.name },
      userId: guard.user.user.id,
    });

    return ok(product);
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    const product = await deleteProduct(id);
    await logAudit({
      action: "PRODUCT_DELETED",
      entityType: "Product",
      entityId: product.id,
      metadata: { name: product.name },
      userId: guard.user.user.id,
    });

    return ok(product);
  } catch (error) {
    return fromError(error);
  }
}
