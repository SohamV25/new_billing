import { requireUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireUser();

  return (
    <AppShell
      user={currentUser.user}
      role={currentUser.role}
      permissions={currentUser.permissions}
    >
      {children}
    </AppShell>
  );
}
