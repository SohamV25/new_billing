import { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

export type BackupSnapshot = {
  schemaVersion: number;
  exportedAt: string;
  data: {
    companySettings: Record<string, unknown> | null;
    roles: Record<string, unknown>[];
    permissions: Record<string, unknown>[];
    rolePermissions: Record<string, unknown>[];
    users: Record<string, unknown>[];
    customers: Record<string, unknown>[];
    categories: Record<string, unknown>[];
    products: Record<string, unknown>[];
    inventory: Record<string, unknown>[];
    stockMovements: Record<string, unknown>[];
    quotations: Record<string, unknown>[];
    quotationItems: Record<string, unknown>[];
    invoices: Record<string, unknown>[];
    invoiceItems: Record<string, unknown>[];
    payments: Record<string, unknown>[];
    auditLogs: Record<string, unknown>[];
  };
};

function serializeDecimal(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) {
    return value.toString();
  }
  return value;
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = serializeDecimal(value);
  }
  return result;
}

export async function exportSnapshot(): Promise<BackupSnapshot> {
  const [
    companySettings,
    roles,
    permissions,
    rolePermissions,
    users,
    customers,
    categories,
    products,
    inventory,
    stockMovements,
    quotations,
    quotationItems,
    invoices,
    invoiceItems,
    payments,
    auditLogs,
  ] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: "default" } }),
    prisma.role.findMany({}),
    prisma.permission.findMany({}),
    prisma.rolePermission.findMany({}),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.customer.findMany({ where: { deletedAt: null } }),
    prisma.category.findMany({ where: { deletedAt: null } }),
    prisma.product.findMany({ where: { deletedAt: null } }),
    prisma.inventory.findMany({}),
    prisma.stockMovement.findMany({}),
    prisma.quotation.findMany({}),
    prisma.quotationItem.findMany({}),
    prisma.invoice.findMany({}),
    prisma.invoiceItem.findMany({}),
    prisma.payment.findMany({}),
    prisma.auditLog.findMany({}),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      companySettings: companySettings
        ? serializeRow(companySettings as Record<string, unknown>)
        : null,
      roles: roles.map((row) => serializeRow(row as Record<string, unknown>)),
      permissions: permissions.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      rolePermissions: rolePermissions.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      users: users.map((row) => serializeRow(row as Record<string, unknown>)),
      customers: customers.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      categories: categories.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      products: products.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      inventory: inventory.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      stockMovements: stockMovements.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      quotations: quotations.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      quotationItems: quotationItems.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      invoices: invoices.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      invoiceItems: invoiceItems.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      payments: payments.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
      auditLogs: auditLogs.map((row) =>
        serializeRow(row as Record<string, unknown>)
      ),
    },
  };
}

export async function importSnapshot(
  snapshot: BackupSnapshot,
  actor: User
): Promise<void> {
  if (snapshot.schemaVersion !== 1) {
    throw new DomainError(
      "INVALID_SCHEMA",
      `Unsupported schema version: ${snapshot.schemaVersion}`,
      400
    );
  }

  const data = snapshot.data;

  const hasData =
    (await prisma.customer.count({ where: { deletedAt: null } })) > 0 ||
    (await prisma.product.count({ where: { deletedAt: null } })) > 0 ||
    (await prisma.invoice.count({})) > 0 ||
    (await prisma.quotation.count({})) > 0 ||
    (await prisma.payment.count({})) > 0;

  if (hasData) {
    throw new DomainError(
      "BACKUP_CONFLICT",
      "Cannot import backup: the database contains business data. The database must be empty before restoring.",
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({});
    await tx.payment.deleteMany({});
    await tx.invoiceItem.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.quotationItem.deleteMany({});
    await tx.quotation.deleteMany({});
    await tx.stockMovement.deleteMany({});
    await tx.inventory.deleteMany({});
    await tx.product.deleteMany({});
    await tx.category.deleteMany({});
    await tx.customer.deleteMany({});
    await tx.rolePermission.deleteMany({});
    await tx.permission.deleteMany({});
    await tx.role.deleteMany({});
    await tx.user.updateMany({
      where: { id: { not: actor.id } },
      data: { roleId: null },
    });
    await tx.user.deleteMany({ where: { id: { not: actor.id } } });
    await tx.companySettings.deleteMany({});

    if (data.companySettings) {
      await tx.companySettings.create({
        data: data.companySettings as Prisma.CompanySettingsCreateInput,
      });
    }

    const createdRoles: Record<string, string> = {};
    for (const role of data.roles as Record<string, unknown>[]) {
      const created = await tx.role.create({
        data: role as Prisma.RoleCreateInput,
      });
      createdRoles[role.id as string] = created.id;
    }

    const createdPermissions: Record<string, string> = {};
    for (const permission of data.permissions as Record<string, unknown>[]) {
      const created = await tx.permission.create({
        data: permission as Prisma.PermissionCreateInput,
      });
      createdPermissions[permission.id as string] = created.id;
    }

    for (const rp of data.rolePermissions as Record<string, unknown>[]) {
      const rpData = rp as Record<string, unknown>;
      await tx.rolePermission.create({
        data: {
          roleId:
            createdRoles[rpData.roleId as string] || (rpData.roleId as string),
          permissionId:
            createdPermissions[rpData.permissionId as string] ||
            (rpData.permissionId as string),
        } as Prisma.RolePermissionUncheckedCreateInput,
      });
    }

    for (const user of data.users as Record<string, unknown>[]) {
      const originalId = (user as Record<string, unknown>).id as string;
      const roleId = (user as Record<string, unknown>).roleId as
        string | undefined;
      const created = await tx.user.create({
        data: {
          id: originalId,
          name: (user as Record<string, unknown>).name as string,
          email: (user as Record<string, unknown>).email as string,
          roleId: roleId ? createdRoles[roleId] || roleId : null,
          image:
            ((user as Record<string, unknown>).image as string | undefined) ??
            null,
        } as Prisma.UserCreateInput,
      });
      createdRoles[originalId] = created.id;
    }

    for (const customer of data.customers as Record<string, unknown>[]) {
      await tx.customer.create({
        data: {
          ...customer,
          id: (customer as Record<string, unknown>).id as string,
        } as Prisma.CustomerCreateInput,
      });
    }

    for (const category of data.categories as Record<string, unknown>[]) {
      await tx.category.create({
        data: {
          ...category,
          id: (category as Record<string, unknown>).id as string,
        } as Prisma.CategoryCreateInput,
      });
    }

    for (const product of data.products as Record<string, unknown>[]) {
      await tx.product.create({
        data: {
          ...product,
          id: (product as Record<string, unknown>).id as string,
        } as Prisma.ProductCreateInput,
      });
    }

    for (const inv of data.inventory as Record<string, unknown>[]) {
      await tx.inventory.create({
        data: {
          ...inv,
          id: (inv as Record<string, unknown>).id as string,
        } as Prisma.InventoryCreateInput,
      });
    }

    for (const sm of data.stockMovements as Record<string, unknown>[]) {
      await tx.stockMovement.create({
        data: {
          ...sm,
          id: (sm as Record<string, unknown>).id as string,
        } as Prisma.StockMovementCreateInput,
      });
    }

    for (const quotation of data.quotations as Record<string, unknown>[]) {
      await tx.quotation.create({
        data: {
          ...quotation,
          id: (quotation as Record<string, unknown>).id as string,
        } as Prisma.QuotationCreateInput,
      });
    }

    for (const qi of data.quotationItems as Record<string, unknown>[]) {
      await tx.quotationItem.create({
        data: {
          ...qi,
          id: (qi as Record<string, unknown>).id as string,
        } as Prisma.QuotationItemCreateInput,
      });
    }

    for (const invoice of data.invoices as Record<string, unknown>[]) {
      await tx.invoice.create({
        data: {
          ...invoice,
          id: (invoice as Record<string, unknown>).id as string,
        } as Prisma.InvoiceCreateInput,
      });
    }

    for (const ii of data.invoiceItems as Record<string, unknown>[]) {
      await tx.invoiceItem.create({
        data: {
          ...ii,
          id: (ii as Record<string, unknown>).id as string,
        } as Prisma.InvoiceItemCreateInput,
      });
    }

    for (const payment of data.payments as Record<string, unknown>[]) {
      await tx.payment.create({
        data: {
          ...payment,
          id: (payment as Record<string, unknown>).id as string,
        } as Prisma.PaymentCreateInput,
      });
    }

    for (const log of data.auditLogs as Record<string, unknown>[]) {
      await tx.auditLog.create({
        data: {
          ...log,
          id: (log as Record<string, unknown>).id as string,
        } as Prisma.AuditLogCreateInput,
      });
    }
  });

  await logAudit({
    action: "BACKUP_IMPORTED",
    entityType: "Backup",
    metadata: { importedAt: snapshot.exportedAt },
    userId: actor.id,
  });
}
