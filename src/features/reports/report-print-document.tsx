import { formatDateTime, formatMoney } from "@/lib/format";
import { REPORT_COLUMNS, type ReportRow } from "@/lib/reports/columns";
import { cn } from "@/lib/utils";
import { REPORT_TITLES } from "./report-config";
import type {
  ReportCompanyInfo,
  ReportMeta,
  ReportSummaryItem,
  ReportType,
} from "./types";

export type ReportPrintDocumentProps = {
  type: ReportType;
  rows: ReportRow[];
  summary: ReportSummaryItem[];
  meta?: ReportMeta | null;
  company: ReportCompanyInfo;
};

export function ReportPrintDocument({
  type,
  rows,
  summary,
  meta,
  company,
}: ReportPrintDocumentProps) {
  const columns = REPORT_COLUMNS[type];
  const location = [company.city, company.state, company.pincode]
    .filter(Boolean)
    .join(", ");
  const footerParts = [
    company.companyName,
    company.gstin,
    company.phone,
    company.email,
    company.website,
  ].filter(Boolean);

  return (
    <div className="report-doc rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="flex items-start justify-between gap-6 p-8 pb-6">
        <div className="flex items-start gap-4">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- print docs need a plain <img> (no optimizer for external/logos)
            <img
              src={company.logoUrl}
              alt={`${company.companyName} logo`}
              className="max-h-12 w-auto object-contain"
            />
          ) : null}
          <div>
            <p className="text-xl font-semibold text-neutral-900">
              {company.companyName}
            </p>
            <div className="mt-1 text-xs leading-5 text-neutral-600">
              {company.address ? <p>{company.address}</p> : null}
              {location ? <p>{location}</p> : null}
              {company.phone ? <p>{company.phone}</p> : null}
              {company.email ? <p>{company.email}</p> : null}
              {company.website ? <p>{company.website}</p> : null}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tracking-wide text-neutral-900 uppercase">
            {REPORT_TITLES[type]}
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Generated {formatDateTime(new Date())}
          </p>
          {meta?.period ? (
            <p className="mt-0.5 text-xs text-neutral-600">{meta.period}</p>
          ) : null}
        </div>
      </div>

      {summary.length > 0 ? (
        <div className="mx-8 mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-neutral-200 px-3 py-2"
            >
              <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                {item.label}
              </p>
              <p className="font-geist mt-0.5 text-sm font-semibold text-neutral-900">
                {item.value}
              </p>
              {item.hint ? (
                <p className="text-[10px] text-neutral-500">{item.hint}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto px-8 pb-4">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "border border-neutral-300 px-2 py-2 text-left font-semibold text-neutral-700",
                      column.align === "right" && "text-right"
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${type}-${index}`}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "border border-neutral-300 px-2 py-1.5 align-top text-neutral-800",
                        column.align === "right" && "text-right",
                        column.mono && "font-geist"
                      )}
                    >
                      {column.value(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {columns.some((column) => column.total) ? (
              <tfoot>
                <tr className="bg-neutral-50">
                  {columns.map((column) => {
                    const total = column.raw
                      ? rows.reduce(
                          (sum, row) => sum + Number(column.raw?.(row) ?? 0),
                          0
                        )
                      : null;
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "border border-neutral-300 px-2 py-2 font-semibold text-neutral-900",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {total !== null ? formatMoney(total) : ""}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      ) : null}

      {footerParts.length > 0 ? (
        <div className="mt-8 border-t border-neutral-200 px-8 py-4 text-center text-xs text-neutral-500">
          {footerParts.join("  ·  ")}
        </div>
      ) : null}
    </div>
  );
}
