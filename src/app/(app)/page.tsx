import { LayoutDashboard, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Business overview and key metrics"
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard is coming soon"
        description="KPIs, revenue analytics and charts will be built in a later sprint. The shell below is ready for them."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total Revenue", value: "—" },
          { label: "Pending Bills", value: "—" },
          { label: "Overdue Bills", value: "—" },
          { label: "Recent Activity", value: "—" },
          { label: "Customers", value: "—" },
          { label: "Products", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="border-border bg-surface-card rounded-xl border p-6"
          >
            <p className="font-geist text-mono-sm text-on-surface-variant tracking-wider uppercase">
              {card.label}
            </p>
            <p className="text-headline-lg text-on-surface mt-2 flex items-center gap-2 font-semibold">
              {card.value}
              {card.label === "Total Revenue" ? (
                <TrendingUp className="text-primary-container size-5" />
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
