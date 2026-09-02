import Link from "next/link";

import { requirePermission, requireUser } from "@/lib/auth/current-user";
import { PERMISSIONS } from "@/config/rbac";
import { prisma } from "@/lib/prisma";
import { runReport } from "@/lib/services/reports";
import { reportQueryFromParams } from "@/lib/validations/report";
import { ReportPrintPreview } from "@/features/reports/report-print-preview";
import type { ReportCompanyInfo } from "@/features/reports/types";

export const dynamic = "force-dynamic";

const PRINT_ROW_CAP = 10_000;

type PrintSearchParams = Record<string, string | string[] | undefined>;

export default async function ReportPrintRoute({
  searchParams,
}: {
  searchParams: Promise<PrintSearchParams>;
}) {
  const currentUser = await requireUser();
  requirePermission(currentUser, PERMISSIONS.REPORTS_VIEW);

  const params = await searchParams;
  const autoprint = params.autoprint === "1";

  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) urlSearchParams.append(key, entry);
    } else if (value !== undefined) {
      urlSearchParams.set(key, value);
    }
  }

  const parsed = reportQueryFromParams(urlSearchParams);
  if (!parsed.success) {
    return (
      <div className="mt-8 text-center">
        <p className="text-body-md text-on-surface-variant">
          Invalid report query.
        </p>
        <Link
          href="/reports"
          className="text-primary hover:text-primary/90 mt-2 inline-flex text-sm"
        >
          Back to reports
        </Link>
      </div>
    );
  }

  const [result, settings] = await Promise.all([
    runReport(parsed.data, { page: 1, pageSize: PRINT_ROW_CAP }),
    prisma.companySettings.findUnique({ where: { id: "default" } }),
  ]);

  const company: ReportCompanyInfo = {
    companyName: settings?.companyName ?? "Stitch Billing",
    logoUrl: settings?.logoUrl ?? null,
    gstin: settings?.gstin ?? null,
    address: settings?.address ?? "",
    city: settings?.city ?? "",
    state: settings?.state ?? "",
    pincode: settings?.pincode ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    website: settings?.website ?? "",
  };

  return (
    <ReportPrintPreview
      type={parsed.data.type}
      rows={result.items}
      summary={result.summary}
      meta={result.meta}
      company={company}
      autoprint={autoprint}
    />
  );
}
