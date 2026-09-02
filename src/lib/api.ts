import type { NextRequest } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { can, getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import type { PermissionName } from "@/config/rbac";
import { DomainError } from "@/lib/errors";

export type SuccessBody<T> = { data: T };
export type ErrorBody = {
  error: { code: string; message: string; details?: unknown };
};
export type ApiBody<T> = SuccessBody<T> | ErrorBody;

/** Result of the auth/permission guard for route handlers. */
export type ApiGuard = { response: Response } | { user: CurrentUser };

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data } satisfies ApiBody<T>, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const body: ErrorBody = {
    error:
      details === undefined ? { code, message } : { code, message, details },
  };
  return Response.json(body, { status });
}

/**
 * Maps thrown errors to consistent API responses. Known domain errors and
 * common Prisma errors produce meaningful status codes; anything else becomes
 * a generic 500 without leaking internals.
 */
export function fromError(error: unknown): Response {
  if (error instanceof DomainError) {
    return error.details === undefined
      ? fail(error.status, error.code, error.message)
      : fail(error.status, error.code, error.message, error.details);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return fail(
        409,
        "CONFLICT",
        "A record with these values already exists."
      );
    }
    if (error.code === "P2025") {
      return fail(404, "NOT_FOUND", "The requested record was not found.");
    }
  }
  console.error("Unhandled API error:", error);
  return fail(500, "INTERNAL", "An unexpected error occurred.");
}

/**
 * Guards a route handler: returns `{ response }` with a 401/403 JSON body when
 * the caller is unauthenticated or lacks the permission, otherwise `{ user }`.
 */
export async function requireApiPermission(
  permission: PermissionName
): Promise<ApiGuard> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      response: fail(401, "UNAUTHORIZED", "Authentication required."),
    };
  }
  if (!can(currentUser, permission)) {
    return {
      response: fail(
        403,
        "FORBIDDEN",
        "You do not have permission to perform this action."
      ),
    };
  }
  return { user: currentUser };
}

export type PaginationParams = {
  page: number;
  pageSize: number;
  search: string;
};

export function getPaginationParams(
  request: NextRequest,
  defaultPageSize = 10
): PaginationParams {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize")) || defaultPageSize)
  );
  const search = searchParams.get("search")?.trim() ?? "";
  return { page, pageSize, search };
}
