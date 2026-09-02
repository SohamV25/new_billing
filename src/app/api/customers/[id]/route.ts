import { NextRequest } from "next/server";

import { PERMISSIONS } from "@/config/rbac";
import { fail, fromError, ok, requireApiPermission } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/services/customers";
import { customerUpdateSchema } from "@/lib/validations/customer";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.CUSTOMERS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    return ok(await getCustomer(id));
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.CUSTOMERS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = customerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const customer = await updateCustomer(id, parsed.data);
    await logAudit({
      action: "CUSTOMER_UPDATED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { name: customer.name },
      userId: guard.user.user.id,
    });

    return ok(customer);
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireApiPermission(PERMISSIONS.CUSTOMERS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { id } = await context.params;
    const customer = await deleteCustomer(id);
    await logAudit({
      action: "CUSTOMER_DELETED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { name: customer.name },
      userId: guard.user.user.id,
    });

    return ok(customer);
  } catch (error) {
    return fromError(error);
  }
}
