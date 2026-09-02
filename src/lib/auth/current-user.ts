import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import {
  hasPermission,
  isPermissionName,
  isRoleName,
  type PermissionName,
  type RoleName,
} from "@/config/rbac";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
};

export type CurrentUser = {
  user: SessionUser;
  role: RoleName | null;
  permissions: PermissionName[];
};

/**
 * Resolves the authenticated user for the current request, including the
 * role and permission names attached through the RBAC tables. Returns null
 * when there is no valid session or the user record no longer exists.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: {
        select: {
          name: true,
          permissions: {
            select: {
              permission: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!dbUser) return null;

  const role = isRoleName(dbUser.role?.name) ? dbUser.role.name : null;
  const permissions = (dbUser.role?.permissions ?? [])
    .map(({ permission }) => permission.name)
    .filter(isPermissionName);

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      emailVerified: dbUser.emailVerified,
    },
    role,
    permissions,
  };
}

/**
 * Returns the current user or redirects to the login page. Use in layouts
 * and server components that require an authenticated session.
 */
export async function requireUser(): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  return currentUser;
}

export function can(
  currentUser: CurrentUser,
  permission: PermissionName
): boolean {
  return hasPermission(currentUser.permissions, permission);
}

/**
 * Aborts with a 403 when the current user lacks the given permission.
 * Use in server components and route handlers for permission-gated logic.
 */
export function requirePermission(
  currentUser: CurrentUser,
  permission: PermissionName
): void {
  if (!can(currentUser, permission)) forbidden();
}
