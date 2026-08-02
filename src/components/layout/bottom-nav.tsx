"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {bottomNav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "font-geist text-mono-sm flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-transform",
              active
                ? "text-primary-container font-medium"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            <item.icon
              className={cn("size-5", active && "fill-primary-container/25")}
            />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
