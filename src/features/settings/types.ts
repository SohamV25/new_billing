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

export type PreferencesDto = {
  id: string;
  userId: string;
  theme: string;
  timezone: string;
  dateFormat: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogListItem = {
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
  items: AuditLogListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type RoleDto = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
};

export type RoleListResult = {
  items: RoleDto[];
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

export type BackupMeta = {
  schemaVersion: number;
  exportedAt: string;
};

export type SettingsTab =
  | "account"
  | "preferences"
  | "company"
  | "invoice"
  | "roles"
  | "audit-log"
  | "backup";
