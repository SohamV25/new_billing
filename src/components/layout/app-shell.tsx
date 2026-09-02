import type { PermissionName, RoleName } from "@/config/rbac";
import type { SessionUser } from "@/lib/auth/current-user";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

type AppShellProps = {
  children: React.ReactNode;
  user: SessionUser;
  role: RoleName | null;
  permissions: PermissionName[];
};

export function AppShell({ children, user, role, permissions }: AppShellProps) {
  return (
    <div className="bg-background flex min-h-dvh">
      <div className="print:hidden">
        <Sidebar user={user} role={role} permissions={permissions} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <div className="print:hidden">
          <TopBar user={user} role={role} />
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <BottomNav permissions={permissions} />
      </div>
    </div>
  );
}
