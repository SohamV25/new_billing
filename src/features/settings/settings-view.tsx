"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "./section-card";
import { AccountForm } from "./account-form";
import { ChangePasswordForm } from "./change-password-form";
import { PreferencesForm } from "./preferences-form";
import { CompanyProfileForm } from "./company-profile-form";
import { InvoiceSettingsForm } from "./invoice-settings-form";
import { RolesView } from "./roles-view";
import { AuditLogView } from "./audit-log-view";
import { BackupView } from "./backup-view";
import type { SettingsTab } from "./types";

type SettingsViewProps = {
  isAdmin: boolean;
};

const TABS: { id: SettingsTab; label: string; adminOnly: boolean }[] = [
  { id: "account", label: "Account", adminOnly: false },
  { id: "preferences", label: "Preferences", adminOnly: false },
  { id: "company", label: "Company profile", adminOnly: true },
  { id: "invoice", label: "Invoice settings", adminOnly: true },
  { id: "roles", label: "Roles & permissions", adminOnly: true },
  { id: "audit-log", label: "Audit log", adminOnly: true },
  { id: "backup", label: "Backup & restore", adminOnly: true },
];

export function SettingsView({ isAdmin }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  function handleTabChange(value: string) {
    setActiveTab(value as SettingsTab);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account, company profile, and system configuration."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Seven tabs do not fit a phone, so mobile picks the section instead. */}
        <div className="mb-5 md:hidden">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger
              className="h-11 w-full"
              aria-label="Settings section"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleTabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsList className="border-outline-variant bg-surface-container scrollbar-hide mb-5 hidden overflow-x-auto rounded-xl border p-1 md:flex">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-on-surface-variant data-[state=active]:bg-primary/12 data-[state=active]:text-primary shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <SectionCard
            title="Account"
            description="Update your profile information."
          >
            <AccountForm />
          </SectionCard>

          <SectionCard
            title="Change password"
            description="Update your password. Other active sessions will be revoked."
          >
            <ChangePasswordForm />
          </SectionCard>
        </TabsContent>

        <TabsContent value="preferences">
          <SectionCard
            title="Preferences"
            description="Customize your display and regional settings."
          >
            <PreferencesForm />
          </SectionCard>
        </TabsContent>

        {isAdmin ? (
          <>
            <TabsContent value="company">
              <SectionCard
                title="Company profile"
                description="Update your company details and contact information."
              >
                <CompanyProfileForm />
              </SectionCard>
            </TabsContent>

            <TabsContent value="invoice">
              <SectionCard
                title="Invoice settings"
                description="Configure invoice and quotation prefixes, currency, and defaults."
              >
                <InvoiceSettingsForm />
              </SectionCard>
            </TabsContent>

            <TabsContent value="roles">
              <SectionCard
                title="Roles & permissions"
                description="Manage roles, permissions, and user assignments."
              >
                <RolesView />
              </SectionCard>
            </TabsContent>

            <TabsContent value="audit-log">
              <SectionCard
                title="Audit log"
                description="View a chronological record of system activity."
              >
                <AuditLogView />
              </SectionCard>
            </TabsContent>

            <TabsContent value="backup">
              <SectionCard
                title="Backup & restore"
                description="Export a JSON snapshot of the database or restore from one."
              >
                <BackupView />
              </SectionCard>
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </>
  );
}
