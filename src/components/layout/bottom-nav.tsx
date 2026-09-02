"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type PermissionName } from "@/config/rbac";
import { bottomNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  permissions: PermissionName[];
};

export function BottomNav({ permissions }: BottomNavProps) {
  const pathname = usePathname();
  const visible = bottomNav.filter(
    (item) => !item.permission || hasPermission(permissions, item.permission)
  );

  return (
    <nav
      aria-label="Primary"
      className="border-outline-variant bg-surface-container/90 fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      {visible.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-150 active:scale-95",
              active
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <item.icon
              className={cn(
                "size-5 transition-all duration-150",
                active && "fill-primary/20"
              )}
            />
            <span className="text-[10px] font-medium tracking-wide">
              {item.title}
            </span>
            {active && (
              <div className="bg-primary absolute -bottom-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
