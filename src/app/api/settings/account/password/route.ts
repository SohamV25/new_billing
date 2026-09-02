import { NextRequest } from "next/server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { fail, fromError, ok } from "@/lib/api";
import { changePassword } from "@/lib/services/settings";
import { changePasswordSchema } from "@/lib/validations/settings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        422,
        "VALIDATION_ERROR",
        "Please check the submitted values.",
        parsed.error.issues
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    await changePassword(
      currentUser.user.id,
      parsed.data,
      session?.session.id ?? currentUser.user.id
    );

    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
