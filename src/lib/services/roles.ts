import { Prisma, type Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/config/rbac";
import type { PermissionName } from "@/config/rbac";
import type {
  RoleCreatePayload,
  RolePermissionsPayload,
  RoleUpdatePayload,
  UserCreatePayload,
} from "@/lib/validations/settings";

export type RoleDto = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionName[];
  userCount: number;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  roleName: string | null;
  roleId: string | null;
  createdAt: string;
};

export type UserListResult = {
  items: UserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type RoleListResult = {
  items: RoleDto[];
};

async function roleWithDetails(role: Role): Promise<RoleDto> {
  const [permissions, userCount] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permission: { select: { name: true } } },
    }),
    prisma.user.count({ where: { roleId: role.id } }),
  ]);
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: permissions.map((rp) => rp.permission.name as PermissionName),
    userCount,
  };
}

export async function listUsers(options: {
  search: string;
  page: number;
  pageSize: number;
}): Promise<UserListResult> {
  const { search, page, pageSize } = options;
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        createdAt: true,
        role: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const items: UserListItem[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roleName: user.role?.name ?? null,
    roleId: user.roleId,
    createdAt: user.createdAt.toISOString(),
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function createUser(
  input: UserCreatePayload
): Promise<UserListItem> {
  const result = await auth.api.signUpEmail({
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
    },
  });

  if (input.roleId) {
    await prisma.user.update({
      where: { id: result.user.id },
      data: { roleId: input.roleId },
    });
  }

  await logAudit({
    action: "USER_CREATED",
    entityType: "User",
    entityId: result.user.id,
    metadata: { name: result.user.name, email: result.user.email },
  });

  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    roleName: null,
    roleId: input.roleId ?? null,
    createdAt: result.user.createdAt.toISOString(),
  };
}

export async function assignUserRole(
  targetUserId: string,
  roleId: string,
  actor: { id: string }
): Promise<void> {
  if (targetUserId === actor.id) {
    throw new DomainError(
      "CANNOT_CHANGE_OWN_ROLE",
      "You cannot change your own role.",
      409
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, roleId: true },
  });
  if (!targetUser) {
    throw new DomainError("NOT_FOUND", "User not found.", 404);
  }

  const targetRole = await prisma.role.findUnique({
    where: { id: roleId },
    select: { name: true },
  });
  if (!targetRole) {
    throw new DomainError("NOT_FOUND", "Role not found.", 404);
  }

  const isLastAdmin =
    targetUser.roleId === ROLES.ADMIN &&
    (await prisma.user.count({
      where: { roleId: ROLES.ADMIN, NOT: { id: targetUserId } },
    })) === 0;

  if (isLastAdmin) {
    throw new DomainError(
      "LAST_ADMIN",
      "Cannot remove the last administrator.",
      409
    );
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { roleId },
  });

  await logAudit({
    action: "USER_ROLE_UPDATED",
    entityType: "User",
    entityId: targetUserId,
    metadata: { targetUserId, roleId },
    userId: actor.id,
  });
}

export async function listRoles(): Promise<RoleListResult> {
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });
  const items = await Promise.all(roles.map(roleWithDetails));
  return { items };
}

export async function createRole(
  input: RoleCreatePayload,
  actor: { id: string }
): Promise<RoleDto> {
  const role = await prisma.role.create({
    data: {
      name: input.name,
      description: input.description,
      isSystem: false,
    },
  });

  const permissionRecords = await prisma.permission.findMany({
    where: { name: { in: input.permissionNames } },
  });

  if (permissionRecords.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionRecords.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
  }

  await logAudit({
    action: "ROLE_CREATED",
    entityType: "Role",
    entityId: role.id,
    metadata: { roleId: role.id, name: role.name },
    userId: actor.id,
  });

  return roleWithDetails(role);
}

export async function updateRole(
  id: string,
  input: RoleUpdatePayload,
  actor: { id: string }
): Promise<RoleDto> {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new DomainError("NOT_FOUND", "Role not found.", 404);
  }
  if (existing.isSystem && input.name && input.name !== existing.name) {
    throw new DomainError(
      "SYSTEM_ROLE",
      "System role names cannot be changed.",
      403
    );
  }

  const updated = await prisma.role.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
    },
  });

  await logAudit({
    action: "ROLE_UPDATED",
    entityType: "Role",
    entityId: id,
    metadata: { roleId: id, name: updated.name },
    userId: actor.id,
  });

  return roleWithDetails(updated);
}

export async function deleteRole(
  id: string,
  actor: { id: string }
): Promise<void> {
  const existing = await prisma.role.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!existing) {
    throw new DomainError("NOT_FOUND", "Role not found.", 404);
  }
  if (existing.isSystem) {
    throw new DomainError(
      "SYSTEM_ROLE",
      "System roles cannot be deleted.",
      403
    );
  }
  if (existing.users.length > 0) {
    throw new DomainError(
      "ROLE_IN_USE",
      "Cannot delete a role that is assigned to users.",
      409
    );
  }

  await prisma.role.delete({ where: { id } });

  await logAudit({
    action: "ROLE_DELETED",
    entityType: "Role",
    entityId: id,
    metadata: { roleId: id, name: existing.name },
    userId: actor.id,
  });
}

export async function setRolePermissions(
  id: string,
  input: RolePermissionsPayload,
  actor: { id: string }
): Promise<RoleDto> {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    throw new DomainError("NOT_FOUND", "Role not found.", 404);
  }
  if (existing.name === ROLES.ADMIN) {
    throw new DomainError(
      "ROLE_LOCKED",
      "ADMIN role permissions cannot be changed.",
      403
    );
  }

  const permissionRecords = await prisma.permission.findMany({
    where: { name: { in: input.permissionNames } },
  });

  await prisma.rolePermission.deleteMany({ where: { roleId: id } });

  if (permissionRecords.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionRecords.map((permission) => ({
        roleId: id,
        permissionId: permission.id,
      })),
    });
  }

  await logAudit({
    action: "ROLE_PERMISSIONS_UPDATED",
    entityType: "Role",
    entityId: id,
    metadata: { roleId: id, name: existing.name },
    userId: actor.id,
  });

  return roleWithDetails(existing);
}
