import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { fail, fromError, ok } from "@/lib/api";
import { upsertUserPreferences } from "@/lib/services/settings";
import { preferencesSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return fail(401, "UNAUTHORIZED", "Authentication required.");
  }

  try {
    return ok(await upsertUserPreferences(currentUser.user.id, {}));
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

    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const prefs = await upsertUserPreferences(currentUser.user.id, parsed.data);
    return ok(prefs);
  } catch (error) {
    return fromError(error);
  }
}
