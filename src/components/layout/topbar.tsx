"use client";

import { Bell, Search } from "lucide-react";
import { appName } from "@/config/navigation";

export function TopBar() {
  return (
    <header className="border-border bg-surface sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="bg-primary-container text-on-primary-container flex size-8 items-center justify-center rounded-lg text-sm font-bold">
          SB
        </div>
        <span className="font-geist text-label-md text-primary font-medium tracking-wide">
          {appName}
        </span>
      </div>

      <div className="border-outline-variant bg-surface-container-low focus-within:border-primary-container focus-within:ring-primary-container hidden max-w-md min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2 transition-colors focus-within:ring-1 lg:flex">
        <Search className="text-outline size-4 shrink-0" />
        <input
          type="search"
          placeholder="Search invoices, customers, products..."
          className="text-body-md text-on-surface placeholder:text-outline w-full bg-transparent outline-none"
        />
        <kbd className="border-outline-variant bg-surface-container-highest font-geist text-mono-sm text-on-surface-variant shrink-0 rounded border px-1.5 py-0.5">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface flex size-10 items-center justify-center rounded-full transition-colors"
        >
          <Bell className="size-5" />
        </button>
        <div className="border-border hidden items-center gap-2 border-l pl-3 sm:flex">
          <div className="bg-surface-container-high text-label-md text-secondary flex size-8 items-center justify-center rounded-full font-medium">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
