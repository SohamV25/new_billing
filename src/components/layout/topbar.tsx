"use client";

import type { RoleName } from "@/config/rbac";
import type { SessionUser } from "@/lib/auth/current-user";
import { appName } from "@/config/navigation";
import { UserMenu } from "@/components/layout/user-menu";

type TopBarProps = {
  user: SessionUser;
  role: RoleName | null;
};

export function TopBar({ user, role }: TopBarProps) {
  return (
    <header className="border-outline-variant bg-background/80 sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b px-4 backdrop-blur-lg lg:h-16 lg:px-6">
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="bg-primary/20 text-primary flex size-7 items-center justify-center rounded-md text-xs font-bold">
          SB
        </div>
        <span className="text-on-surface text-sm font-medium tracking-wide">
          {appName}
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <UserMenu user={user} role={role} />
      </div>
    </header>
  );
}
