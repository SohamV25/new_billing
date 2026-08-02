"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appName, mainNav, secondaryNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-surface sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="bg-primary-container text-on-primary-container flex size-8 items-center justify-center rounded-lg text-sm font-bold">
          SB
        </div>
        <span className="font-geist text-label-md text-primary font-medium tracking-wide">
          {appName}
        </span>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={pathname === item.href}
            >
              <item.icon className="size-4" />
              {item.title}
            </NavLink>
          ))}
        </div>
        <div className="border-border space-y-1 border-t pt-6">
          {secondaryNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={pathname === item.href}
            >
              <item.icon className="size-4" />
              {item.title}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-border border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="bg-surface-container-high text-label-md text-secondary flex size-8 items-center justify-center rounded-full font-medium">
            U
          </div>
          <div className="min-w-0">
            <p className="text-body-md text-on-surface truncate font-medium">
              Sign in
            </p>
            <p className="font-geist text-mono-sm text-on-surface-variant truncate">
              not authenticated
            </p>
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
        "text-body-md flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
        active
          ? "bg-primary-container/10 text-primary-container"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      )}
    >
      {children}
    </Link>
  );
}
