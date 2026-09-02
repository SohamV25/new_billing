import { apiFetch } from "@/lib/client/api";
import type {
  AuditLogResult,
  BackupMeta,
  CompanySettingsDto,
  PreferencesDto,
  RoleListResult,
  RoleDto,
  UserListItem,
  UserListResult,
} from "./types";
import type {
  AccountUpdatePayload,
  ChangePasswordPayload,
  CompanyProfilePayload,
  InvoiceSettingsPayload,
  PreferencesPayload,
  RoleCreatePayload,
  RolePermissionsPayload,
  RoleUpdatePayload,
  UserCreatePayload,
  UserRolePayload,
} from "@/lib/validations/settings";

export const settingsApi = {
  company: {
    get(): Promise<CompanySettingsDto> {
      return apiFetch("/api/settings/company");
    },
    update(input: CompanyProfilePayload): Promise<CompanySettingsDto> {
      return apiFetch("/api/settings/company", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
  },
  invoice: {
    get(): Promise<CompanySettingsDto> {
      return apiFetch("/api/settings/invoice");
    },
    update(input: InvoiceSettingsPayload): Promise<CompanySettingsDto> {
      return apiFetch("/api/settings/invoice", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
  },
  account: {
    get(): Promise<{
      id: string;
      name: string;
      email: string;
      image: string | null;
    }> {
      return apiFetch("/api/settings/account");
    },
    update(input: AccountUpdatePayload) {
      return apiFetch("/api/settings/account", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    changePassword(input: ChangePasswordPayload) {
      return apiFetch("/api/settings/account/password", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  },
  preferences: {
    get(): Promise<PreferencesDto> {
      return apiFetch("/api/settings/preferences");
    },
    update(input: PreferencesPayload) {
      return apiFetch("/api/settings/preferences", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
  },
  users: {
    list(query: { search?: string; page?: number; pageSize?: number } = {}) {
      const params = new URLSearchParams();
      if (query.search) params.set("search", query.search);
      if (query.page) params.set("page", String(query.page));
      if (query.pageSize) params.set("pageSize", String(query.pageSize));
      const qs = params.toString();
      return apiFetch<UserListResult>(
        `/api/settings/users${qs ? `?${qs}` : ""}`
      );
    },
    create(input: UserCreatePayload) {
      return apiFetch<UserListItem>("/api/settings/users", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    assignRole(userId: string, input: UserRolePayload) {
      return apiFetch(`/api/settings/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
  },
  roles: {
    list(): Promise<RoleListResult> {
      return apiFetch("/api/settings/roles");
    },
    create(input: RoleCreatePayload) {
      return apiFetch<RoleDto>("/api/settings/roles", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    update(id: string, input: RoleUpdatePayload) {
      return apiFetch<RoleDto>(`/api/settings/roles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    delete(id: string) {
      return apiFetch(`/api/settings/roles/${id}`, { method: "DELETE" });
    },
    setPermissions(id: string, input: RolePermissionsPayload) {
      return apiFetch<RoleDto>(`/api/settings/roles/${id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
  },
  auditLog: {
    list(
      query: {
        action?: string;
        search?: string;
        page?: number;
        pageSize?: number;
      } = {}
    ) {
      const params = new URLSearchParams();
      if (query.action) params.set("action", query.action);
      if (query.search) params.set("search", query.search);
      if (query.page) params.set("page", String(query.page));
      if (query.pageSize) params.set("pageSize", String(query.pageSize));
      const qs = params.toString();
      return apiFetch<AuditLogResult>(
        `/api/settings/audit-log${qs ? `?${qs}` : ""}`
      );
    },
  },
  backup: {
    export(): Promise<BackupMeta> {
      return apiFetch("/api/settings/backup/export");
    },
    import(snapshot: unknown) {
      return apiFetch("/api/settings/backup/import", {
        method: "POST",
        body: JSON.stringify(snapshot),
      });
    },
  },
};
