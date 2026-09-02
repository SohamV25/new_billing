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
import { createProduct, listProducts } from "@/lib/services/products";
import { productCreateSchema } from "@/lib/validations/product";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    return ok(
      await listProducts({
        search,
        page,
        pageSize,
      })
    );
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.PRODUCTS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const product = await createProduct(parsed.data);
    await logAudit({
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      metadata: { name: product.name },
      userId: guard.user.user.id,
    });

    return ok(product, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
