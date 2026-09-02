/**
 * Application-level RBAC definitions.
 *
 * These constants mirror the rows seeded into the `Role` and `Permission`
 * tables (see prisma/seed.ts). They exist so permissions can be referenced
 * statically in navigation, guards, and UI without string literals scattered
 * across the codebase. The database remains the source of truth at runtime;
 * `getCurrentUser()` resolves a user's role and permissions from Prisma.
 */

export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  INVOICES_VIEW: "invoices:view",
  QUOTATIONS_VIEW: "quotations:view",
  CUSTOMERS_VIEW: "customers:view",
  PRODUCTS_VIEW: "products:view",
  REPORTS_VIEW: "reports:view",
  SETTINGS_VIEW: "settings:view",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.QUOTATIONS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
  ],
} as const satisfies Record<RoleName, readonly PermissionName[]>;

export function isRoleName(
  value: string | null | undefined
): value is RoleName {
  return typeof value === "string" && value in ROLES;
}

export function isPermissionName(
  value: string | null | undefined
): value is PermissionName {
  return (
    typeof value === "string" &&
    (Object.values(PERMISSIONS) as readonly string[]).includes(value)
  );
}

export function hasPermission(
  permissions: readonly PermissionName[],
  permission: PermissionName
): boolean {
  return permissions.includes(permission);
}
