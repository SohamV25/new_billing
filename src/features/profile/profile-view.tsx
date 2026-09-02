"use client";

import { Shield, User, Lock, Building2 } from "lucide-react";
import type { SessionUser } from "@/lib/auth/current-user";
import type { RoleName } from "@/config/rbac";
import { initials } from "@/lib/helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "@/features/settings/account-form";
import { ChangePasswordForm } from "@/features/settings/change-password-form";
import { PageHeader } from "@/components/page-header";

type ProfileViewProps = {
  user: SessionUser;
  role: RoleName | null;
  companyName: string;
};

export function ProfileView({ user, role, companyName }: ProfileViewProps) {
  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your account settings and preferences."
      />

      <div className="mt-5 space-y-5">
        {/* Profile Header Card */}
        <div className="border-outline-variant/40 bg-surface-card rounded-xl border p-5 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="size-20">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-surface-container-highest text-lg">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-on-surface text-lg font-semibold">
                {user.name}
              </h2>
              <p className="text-on-surface-variant mt-0.5 text-sm">
                {user.email}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {role ? (
                  <Badge
                    variant="outline"
                    className="border-outline-variant/60 font-geist text-xs"
                  >
                    <Shield className="mr-1 size-3" />
                    {role}
                  </Badge>
                ) : null}
                <Badge
                  variant="secondary"
                  className="bg-surface-container-high text-on-surface-variant"
                >
                  <Building2 className="mr-1 size-3" />
                  {companyName}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="border-outline-variant/40 bg-surface-card rounded-xl border">
          <div className="border-outline-variant/30 border-b px-4 py-3 sm:px-5">
            <h3 className="text-on-surface flex items-center gap-2 text-sm font-medium">
              <User className="text-primary-container size-4" />
              Account
            </h3>
          </div>
          <div className="p-4 sm:p-5">
            <AccountForm />
          </div>
        </div>

        {/* Security */}
        <div className="border-outline-variant/40 bg-surface-card rounded-xl border">
          <div className="border-outline-variant/30 border-b px-4 py-3 sm:px-5">
            <h3 className="text-on-surface flex items-center gap-2 text-sm font-medium">
              <Lock className="text-primary-container size-4" />
              Security
            </h3>
          </div>
          <div className="p-4 sm:p-5">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
