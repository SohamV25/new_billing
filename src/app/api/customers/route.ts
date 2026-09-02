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
import { createCustomer, listCustomers } from "@/lib/services/customers";
import { customerCreateSchema } from "@/lib/validations/customer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.CUSTOMERS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    const { search, page, pageSize } = getPaginationParams(request);
    const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
    const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
    return ok(
      await listCustomers({
        search,
        page,
        pageSize,
        city: city || undefined,
        state: state || undefined,
      })
    );
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission(PERMISSIONS.CUSTOMERS_VIEW);
  if ("response" in guard) return guard.response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = customerCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const customer = await createCustomer(parsed.data);
    await logAudit({
      action: "CUSTOMER_CREATED",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { name: customer.name },
      userId: guard.user.user.id,
    });

    return ok(customer, { status: 201 });
  } catch (error) {
    return fromError(error);
  }
}
