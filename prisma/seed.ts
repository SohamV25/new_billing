import "dotenv/config";
import {
  ROLES,
  ROLE_PERMISSIONS,
  PERMISSIONS,
  type RoleName,
} from "../src/config/rbac";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  [ROLES.ADMIN]: "Full access to the billing dashboard and settings.",
  [ROLES.STAFF]: "Day-to-day billing operations without settings access.",
};

async function main() {
  const roleIds: Partial<Record<RoleName, string>> = {};

  for (const roleName of Object.values(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { isSystem: true },
      create: {
        name: roleName,
        description: ROLE_DESCRIPTIONS[roleName],
        isSystem: true,
      },
    });
    roleIds[roleName] = role.id;
  }

  for (const permission of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { name: permission },
      update: {},
      create: { name: permission },
    });
  }

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIds[roleName as RoleName];
    if (!roleId) continue;

    const existing = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    const existingIds = new Set(existing.map((entry) => entry.permissionId));

    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });
      if (!permission || existingIds.has(permission.id)) continue;
      await prisma.rolePermission.create({
        data: { roleId, permissionId: permission.id },
      });
    }
  }

  const adminRoleId = roleIds[ROLES.ADMIN];
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@stitchbilling.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const adminUserId =
    existingAdmin?.id ??
    (
      await auth.api.signUpEmail({
        body: {
          name: "Administrator",
          email: adminEmail,
          password: adminPassword,
        },
      })
    ).user.id;

  if (adminRoleId && adminUserId) {
    await prisma.user.update({
      where: { id: adminUserId },
      data: { roleId: adminRoleId },
    });
  }

  console.log("Seeded roles, permissions, and the admin user.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
