"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/client/api";
import type { CompanySettingsDto } from "./types";
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
import { settingsApi } from "./api";
import type { SettingsTab } from "./types";

function invalidateSettings(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["settings-company"] });
  void queryClient.invalidateQueries({ queryKey: ["settings-invoice"] });
  void queryClient.invalidateQueries({ queryKey: ["account"] });
  void queryClient.invalidateQueries({ queryKey: ["preferences"] });
  void queryClient.invalidateQueries({ queryKey: ["settings-users"] });
  void queryClient.invalidateQueries({ queryKey: ["settings-roles"] });
  void queryClient.invalidateQueries({ queryKey: ["settings-audit-log"] });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["settings-company"],
    queryFn: () => settingsApi.company.get(),
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanyProfilePayload) =>
      settingsApi.company.update(input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Company profile updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateInvoiceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvoiceSettingsPayload) =>
      settingsApi.invoice.update(input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Invoice settings updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: () => settingsApi.account.get(),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountUpdatePayload) =>
      settingsApi.account.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.success("Account updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordPayload) =>
      settingsApi.account.changePassword(input),
    onSuccess: () => {
      toast.success("Password changed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => settingsApi.preferences.get(),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PreferencesPayload) =>
      settingsApi.preferences.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Preferences updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUsers(
  query: { search?: string; page?: number; pageSize?: number } = {}
) {
  return useQuery({
    queryKey: ["settings-users", query],
    queryFn: () => settingsApi.users.list(query),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserCreatePayload) => settingsApi.users.create(input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("User created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: UserRolePayload;
    }) => settingsApi.users.assignRole(userId, input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Role assigned");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["settings-roles"],
    queryFn: () => settingsApi.roles.list(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleCreatePayload) => settingsApi.roles.create(input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Role created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RoleUpdatePayload }) =>
      settingsApi.roles.update(id, input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Role updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsApi.roles.delete(id),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Role deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: RolePermissionsPayload;
    }) => settingsApi.roles.setPermissions(id, input),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Permissions updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAuditLog(
  query: {
    action?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  return useQuery({
    queryKey: ["settings-audit-log", query],
    queryFn: () => settingsApi.auditLog.list(query),
  });
}

export function useExportBackup() {
  return useMutation({
    mutationFn: () => settingsApi.backup.export(),
    onSuccess: (data) => {
      toast.success("Backup exported");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useImportBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (snapshot: unknown) => settingsApi.backup.import(snapshot),
    onSuccess: () => {
      invalidateSettings(queryClient);
      toast.success("Backup imported successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
