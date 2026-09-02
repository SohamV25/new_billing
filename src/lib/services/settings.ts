import { Prisma, type AuditAction } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { DomainError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type {
  CompanyProfilePayload,
  InvoiceSettingsPayload,
  PreferencesPayload,
} from "@/lib/validations/settings";

export type CompanySettingsDto = {
  id: string;
  companyName: string;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  invoicePrefix: string;
  nextInvoiceNo: number;
  quotationPrefix: string;
  nextQuotationNo: number;
  currency: string;
  defaultGstRate: number | null;
  defaultTerms: string | null;
};

function toDto(
  settings: Prisma.CompanySettingsGetPayload<Prisma.CompanySettingsDefaultArgs>
): CompanySettingsDto {
  return {
    id: settings.id,
    companyName: settings.companyName,
    gstin: settings.gstin,
    address: settings.address,
    city: settings.city,
    state: settings.state,
    pincode: settings.pincode,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    logoUrl: settings.logoUrl,
    invoicePrefix: settings.invoicePrefix,
    nextInvoiceNo: settings.nextInvoiceNo,
    quotationPrefix: settings.quotationPrefix,
    nextQuotationNo: settings.nextQuotationNo,
    currency: settings.currency,
    defaultGstRate: settings.defaultGstRate?.toNumber() ?? null,
    defaultTerms: settings.defaultTerms,
  };
}

export async function getCompanySettings(): Promise<CompanySettingsDto> {
  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    throw new DomainError("NOT_FOUND", "Company settings not found.", 404);
  }
  return toDto(settings);
}

export async function updateCompanyProfile(
  input: CompanyProfilePayload
): Promise<CompanySettingsDto> {
  const settings = await prisma.companySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      companyName: input.companyName,
      gstin: input.gstin,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      phone: input.phone,
      email: input.email,
      website: input.website,
      logoUrl: input.logoUrl,
    },
    update: {
      companyName: input.companyName,
      gstin: input.gstin,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      phone: input.phone,
      email: input.email,
      website: input.website,
      logoUrl: input.logoUrl,
    },
  });
  return toDto(settings);
}

export async function updateInvoiceSettings(
  input: InvoiceSettingsPayload
): Promise<CompanySettingsDto> {
  const settings = await prisma.companySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      invoicePrefix: input.invoicePrefix,
      quotationPrefix: input.quotationPrefix,
      currency: input.currency,
      defaultGstRate: input.defaultGstRate,
      defaultTerms: input.defaultTerms,
    },
    update: {
      invoicePrefix: input.invoicePrefix,
      quotationPrefix: input.quotationPrefix,
      currency: input.currency,
      defaultGstRate: input.defaultGstRate,
      defaultTerms: input.defaultTerms,
    },
  });
  return toDto(settings);
}

export async function updateAccountProfile(
  userId: string,
  input: { name: string; image: string | null }
) {
  const result = await auth.api.updateUser({
    headers: await headers(),
    body: { name: input.name, image: input.image },
  });
  await logAudit({
    action: "PROFILE_UPDATED",
    entityType: "User",
    entityId: userId,
    userId,
  });
  return result;
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
  sessionId: string
) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
    select: { id: true, password: true },
  });

  if (!account) {
    throw new DomainError(
      "NO_PASSWORD",
      "No password account found for this user.",
      409
    );
  }

  if (!account.password) {
    throw new DomainError(
      "NO_PASSWORD",
      "No password account found for this user.",
      409
    );
  }

  const verified = await verifyPassword({
    hash: account.password,
    password: input.currentPassword,
  });

  if (!verified) {
    throw new DomainError(
      "INVALID_CURRENT_PASSWORD",
      "The current password is incorrect.",
      422
    );
  }

  const hashed = await hashPassword(input.newPassword);
  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashed },
  });

  await prisma.session.deleteMany({
    where: {
      userId,
      NOT: { id: sessionId },
    },
  });

  await logAudit({
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: userId,
    userId,
  });
}

export async function getUserPreferences(userId: string) {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });
  return prefs;
}

export async function upsertUserPreferences(
  userId: string,
  input: Partial<PreferencesPayload>
) {
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (existing) {
    const updated = await prisma.userPreferences.update({
      where: { id: existing.id },
      data: input,
    });
    return updated;
  }

  const created = await prisma.userPreferences.create({
    data: {
      userId,
      theme: input.theme ?? "DARK",
      timezone: input.timezone ?? "Asia/Kolkata",
      dateFormat: input.dateFormat ?? "DD/MM/YYYY",
    },
  });
  return created;
}

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
};

export type AuditLogResult = {
  items: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export async function listAuditLog(options: {
  action?: string;
  search?: string;
  page: number;
  pageSize: number;
}): Promise<AuditLogResult> {
  const { action, search, page, pageSize } = options;

  const where: Prisma.AuditLogWhereInput = {};
  if (action) {
    where.action = action as AuditAction;
  }
  if (search) {
    where.OR = [{ entityType: { equals: search, mode: "insensitive" } }];
  }

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const items: AuditLogEntry[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata as Record<string, unknown> | null,
    userId: log.userId,
    userName: log.user?.name ?? null,
    userEmail: log.user?.email ?? null,
    createdAt: log.createdAt.toISOString(),
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
