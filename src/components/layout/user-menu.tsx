"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/auth/current-user";
import type { RoleName } from "@/config/rbac";
import { initials } from "@/lib/helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type UserMenuProps = {
  user: SessionUser;
  role: RoleName | null;
};

export function UserMenu({ user, role }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Account menu"
          className="text-on-surface-variant hover:bg-surface-variant hover:text-on-surface size-9 rounded-full"
        >
          <Avatar size="sm" className="size-9">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              <span className="text-label-md text-secondary">
                {initials(user.name)}
              </span>
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 p-2.5">
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback>
              <span className="text-label-md text-secondary">
                {initials(user.name)}
              </span>
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="text-body-md text-on-surface block truncate font-medium">
              {user.name}
            </span>
            <span className="font-geist text-mono-sm text-on-surface-variant block truncate">
              {user.email}
            </span>
          </span>
          {role ? (
            <Badge variant="outline" className="font-geist text-mono-sm">
              {role}
            </Badge>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
