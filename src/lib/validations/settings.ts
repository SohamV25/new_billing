import { z } from "zod";
import { GSTIN_PATTERN } from "./gstin";
import { PERMISSIONS } from "@/config/rbac";
import type { PermissionName } from "@/config/rbac";

export const companyProfileSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name must be 200 characters or fewer"),
  gstin: z
    .string()
    .trim()
    .regex(GSTIN_PATTERN, "Enter a valid GSTIN")
    .optional()
    .nullable(),
  address: z
    .string()
    .trim()
    .max(500, "Address must be 500 characters or fewer")
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .max(100, "City must be 100 characters or fewer")
    .optional()
    .nullable(),
  state: z
    .string()
    .trim()
    .max(100, "State must be 100 characters or fewer")
    .optional()
    .nullable(),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Pincode must be 6 digits")
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number")
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(200, "Email must be 200 characters or fewer")
    .optional()
    .nullable(),
  website: z.string().trim().url("Enter a valid URL").optional().nullable(),
  logoUrl: z.string().trim().url("Enter a valid URL").optional().nullable(),
});

export const invoiceSettingsSchema = z.object({
  invoicePrefix: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{1,10}$/,
      "Prefix must be 1–10 alphanumeric characters"
    ),
  quotationPrefix: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{1,10}$/,
      "Prefix must be 1–10 alphanumeric characters"
    ),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code"),
  defaultGstRate: z
    .number()
    .min(0, "GST rate must be 0 or greater")
    .max(100, "GST rate must be 100 or less")
    .nullable(),
  defaultTerms: z
    .string()
    .trim()
    .max(4000, "Terms must be 4000 characters or fewer")
    .optional()
    .nullable(),
});

export const accountUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  image: z.string().trim().url("Enter a valid URL").optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required")
    .max(128, "Password must be 128 characters or fewer"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

export const preferencesSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]),
});

export const roleCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(
      /^[A-Z0-9_]{1,50}$/,
      "Name must be 1–50 uppercase alphanumeric/underscore"
    ),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer")
    .optional()
    .nullable(),
  permissionNames: z
    .array(z.string())
    .refine(
      (values) =>
        values.every((value) =>
          Object.values(PERMISSIONS).includes(value as PermissionName)
        ),
      "One or more invalid permissions"
    ),
});

export const roleUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(
      /^[A-Z0-9_]{1,50}$/,
      "Name must be 1–50 uppercase alphanumeric/underscore"
    )
    .optional(),
  description: z
    .string()
    .trim()
    .max(300, "Description must be 300 characters or fewer")
    .optional()
    .nullable(),
});

export const rolePermissionsSchema = z.object({
  permissionNames: z
    .array(z.string())
    .refine(
      (values) =>
        values.every((value) =>
          Object.values(PERMISSIONS).includes(value as PermissionName)
        ),
      "One or more invalid permissions"
    ),
});

export const userCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(200, "Email must be 200 characters or fewer"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
  roleId: z.string().uuid().optional(),
});

export const userRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
});

export type CompanyProfilePayload = z.infer<typeof companyProfileSchema>;
export type InvoiceSettingsPayload = z.infer<typeof invoiceSettingsSchema>;
export type AccountUpdatePayload = z.infer<typeof accountUpdateSchema>;
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;
export type PreferencesPayload = z.infer<typeof preferencesSchema>;
export type RoleCreatePayload = z.infer<typeof roleCreateSchema>;
export type RoleUpdatePayload = z.infer<typeof roleUpdateSchema>;
export type RolePermissionsPayload = z.infer<typeof rolePermissionsSchema>;
export type UserCreatePayload = z.infer<typeof userCreateSchema>;
export type UserRolePayload = z.infer<typeof userRoleSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
