import { requireUser, can } from "@/lib/auth/current-user";
import { PERMISSIONS } from "@/config/rbac";
import { SettingsView } from "@/features/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await requireUser();
  const isAdmin = can(currentUser, PERMISSIONS.SETTINGS_VIEW);

  return <SettingsView isAdmin={isAdmin} />;
}
