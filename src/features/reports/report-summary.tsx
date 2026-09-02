import type { ReportSummaryItem } from "./types";

type ReportSummaryProps = {
  items: ReportSummaryItem[] | undefined;
};

export function ReportSummary({ items }: ReportSummaryProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border bg-surface-card rounded-xl border p-6"
        >
          <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
            {item.label}
          </p>
          <p className="text-headline-lg text-on-surface mt-2 font-semibold">
            {item.value}
          </p>
          {item.hint ? (
            <p className="text-muted-foreground mt-1 text-xs">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
