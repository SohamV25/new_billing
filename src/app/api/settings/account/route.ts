import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { fail, fromError, ok } from "@/lib/api";
import { updateAccountProfile } from "@/lib/services/settings";
import { accountUpdateSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "Authentication required.");
  }

  try {
    return ok(currentUser.user);
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "Authentication required.");
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "INVALID_BODY", "Request body must be valid JSON.");
    }

    const parsed = accountUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const updated = await updateAccountProfile(currentUser.user.id, {
      name: parsed.data.name,
      image: parsed.data.image ?? null,
    });
    return ok(updated);
  } catch (error) {
    return fromError(error);
  }
}
