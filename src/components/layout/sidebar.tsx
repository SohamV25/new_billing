"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  hasPermission,
  type PermissionName,
  type RoleName,
} from "@/config/rbac";
import { appName, mainNav, secondaryNav } from "@/config/navigation";
import type { SessionUser } from "@/lib/auth/current-user";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type SidebarProps = {
  user: SessionUser;
  role: RoleName | null;
  permissions: PermissionName[];
};

export function Sidebar({ user, role, permissions }: SidebarProps) {
  const pathname = usePathname();
  const visibleMain = mainNav.filter(
    (item) => !item.permission || hasPermission(permissions, item.permission)
  );
  const visibleSecondary = secondaryNav.filter(
    (item) => !item.permission || hasPermission(permissions, item.permission)
  );

  return (
    <aside className="border-outline-variant bg-surface-container sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="bg-primary/20 text-primary flex size-8 items-center justify-center rounded-lg text-sm font-bold">
          SB
        </div>
        <span className="text-on-surface text-sm font-medium tracking-wide">
          {appName}
        </span>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {visibleMain.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.title}
            </NavLink>
          ))}
        </div>
        {visibleSecondary.length > 0 ? (
          <div className="border-outline-variant mt-4 space-y-0.5 border-t pt-4">
            {visibleSecondary.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                active={
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                }
              >
                <item.icon className="size-4 shrink-0" />
                {item.title}
              </NavLink>
            ))}
          </div>
        ) : null}
      </nav>

      <div className="border-outline-variant border-t p-3">
        <div className="hover:bg-surface-container-high flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors">
          <Avatar className="size-9">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-surface-container-high">
              <span className="text-on-surface-variant text-sm">
                {initials(user.name)}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-on-surface truncate text-sm font-medium">
              {user.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant truncate text-xs">
                {user.email}
              </span>
              {role ? (
                <Badge
                  variant="outline"
                  className="border-outline-variant text-on-surface-variant shrink-0 px-1 py-0 text-[10px]"
                >
                  {role}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      )}
    >
      {active && (
        <div className="bg-primary absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r" />
      )}
      {children}
    </Link>
  );
}
