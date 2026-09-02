"use client";

import { useState, useMemo } from "react";
import {
  RefreshCw,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  DollarSign,
  Receipt,
  FileText,
  Clock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { KpiCard } from "./kpi-card";
import { QuickActions } from "./quick-actions";
import { RangeFilter } from "./range-filter";
import { SalesLineChart } from "./sales-line-chart";
import { ProductSalesChart } from "./product-sales-chart";
import { ProductPieChart } from "./product-pie-chart";
import { TopList } from "./top-list";
import { LowStockPanel } from "./low-stock-panel";
import { ActivityPanel } from "./activity-panel";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { useDashboard, buildDashboardQuery } from "./hooks";
import type { DashboardData, SalesGranularity } from "./types";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/reports/columns";
import { StatusBadge } from "@/components/status-badge";

const DEFAULT_TOP_N = 5;

export function DashboardView() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({});
  const [granularity, setGranularity] = useState<SalesGranularity>("month");

  const query = useMemo(
    () => buildDashboardQuery(range, DEFAULT_TOP_N, granularity),
    [range, granularity]
  );
  const { data, isLoading, isError, refetch, isPlaceholderData } =
    useDashboard(query);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading && !isPlaceholderData) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        message="We couldn't load the dashboard."
        onRetry={handleRefresh}
      />
    );
  }

  const d = data as DashboardData | undefined;

  if (!d) {
    return <DashboardSkeleton />;
  }

  // Format KPI cards
  const kpiCards: {
    label: string;
    value: string;
    sub?: string;
    subTone?: "default" | "success" | "error" | "accent";
    icon: typeof TrendingUp;
  }[] = [
    {
      label: "Total Revenue",
      value: formatMoney(d.kpis.totalRevenue),
      icon: TrendingUp,
    },
    {
      label: "Monthly Revenue",
      value: formatMoney(d.kpis.monthlyRevenue),
      sub: "This month",
      subTone: "accent" as const,
      icon: DollarSign,
    },
    {
      label: "Total Customers",
      value: formatNumber(d.kpis.totalCustomers),
      icon: Users,
    },
    {
      label: "Active Customers",
      value: formatNumber(d.kpis.activeCustomers),
      sub: `of ${d.kpis.totalCustomers} total`,
      icon: Users,
    },
    {
      label: "Total Products",
      value: formatNumber(d.kpis.totalProducts),
      icon: Package,
    },
    {
      label: "Low Stock Products",
      value: formatNumber(d.kpis.lowStockProducts),
      subTone: (d.kpis.lowStockProducts > 0 ? "error" : "success") as
        "error" | "success",
      icon: AlertTriangle,
    },
    {
      label: "Pending Payments",
      value: formatNumber(d.kpis.pendingPayments),
      sub: formatMoney(d.kpis.pendingPaymentsAmount),
      subTone: (d.kpis.pendingPayments > 0 ? "error" : "success") as
        "error" | "success",
      icon: Clock,
    },
    {
      label: "Outstanding Amount",
      value: formatMoney(d.kpis.outstandingAmount),
      subTone: (Number(d.kpis.outstandingAmount) > 0 ? "error" : "success") as
        "error" | "success",
      icon: CreditCard,
    },
    {
      label: "Total Invoices",
      value: formatNumber(d.kpis.totalInvoices),
      icon: FileText,
    },
    {
      label: "Paid Invoices",
      value: formatNumber(d.kpis.paidInvoices),
      sub: `${d.kpis.totalInvoices > 0 ? Math.round((d.kpis.paidInvoices / d.kpis.totalInvoices) * 100) : 0}%`,
      subTone: "success" as const,
      icon: Receipt,
    },
    {
      label: "Unpaid Invoices",
      value: formatNumber(d.kpis.unpaidInvoices),
      subTone: d.kpis.unpaidInvoices > 0 ? "error" : ("success" as const),
      icon: AlertTriangle,
    },
  ];

  // Format activity feeds
  const recentInvoicesActivity = d.recentInvoices.map((inv) => ({
    id: inv.id,
    primary: inv.customer.name,
    secondary: inv.invoiceNo,
    trailing: (
      <>
        <span className="text-on-surface text-sm font-medium tabular-nums">
          {formatMoney(inv.totalAmount)}
        </span>
        <StatusBadge
          status={
            inv.status.toLowerCase() as
              "paid" | "pending" | "overdue" | "draft" | "cancelled"
          }
          label={INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
        />
      </>
    ),
  }));

  const recentPaymentsActivity = d.recentPayments.map((pay) => ({
    id: pay.id,
    primary: pay.customer.name,
    secondary: pay.invoiceNo,
    trailing: (
      <>
        <span className="text-on-surface text-sm font-medium tabular-nums">
          {formatMoney(pay.amount)}
        </span>
        <StatusBadge
          status={
            pay.status.toLowerCase() as "completed" | "pending" | "refunded"
          }
          label={
            PAYMENT_STATUS_LABELS[
              pay.status as keyof typeof PAYMENT_STATUS_LABELS
            ] ?? pay.status
          }
        />
      </>
    ),
  }));

  const recentCustomersActivity = d.recentCustomers.map((cust) => ({
    id: cust.id,
    primary: cust.name,
    secondary:
      [cust.city, cust.state].filter(Boolean).join(", ") || "No location",
    trailing: (
      <span className="text-on-surface-variant text-xs">
        {formatDate(cust.createdAt)}
      </span>
    ),
  }));

  const recentMovementsActivity = d.recentMovements.map((mov) => ({
    id: mov.id,
    primary: mov.product.name,
    secondary: `${mov.type === "IN" ? "+" : "-"}${formatNumber(mov.quantity)} ${mov.product.unit ?? "units"}`,
    trailing: (
      <>
        <span className="text-on-surface-variant text-xs">
          {formatDate(mov.createdAt)}
        </span>
        <StatusBadge
          status={mov.type.toLowerCase() as "in" | "out"}
          label={mov.type}
        />
      </>
    ),
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Business overview and key metrics"
        actions={
          <div className="flex items-center gap-2">
            <RangeFilter value={range} onChange={setRange} />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              aria-label="Refresh dashboard"
              disabled={isLoading}
              className="border-outline-variant bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {kpiCards.slice(0, 4).map((kpi, index) => (
          <KpiCard
            key={index}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            subTone={kpi.subTone}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-5">
        <QuickActions />
      </div>

      {/* Charts — line, pie and grouped bars answer "how are sales going?" */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <SalesLineChart data={d.revenueTrend} title="Revenue trend" />

        <ProductSalesChart
          data={d.productSales}
          granularity={granularity}
          onGranularityChange={setGranularity}
          title="Sales by product"
        />

        <ProductPieChart data={d.productSales} title="Revenue by product" />

        <TopList
          items={d.topCustomers}
          title="Top customers"
          valueKey="billed"
          labelKey="name"
          subKey="invoiceCount"
        />

        {/* Low Stock Overview */}
        <LowStockPanel items={d.lowStock} title="Low Stock Overview" />
      </div>

      {/* Activity Feeds */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActivityPanel
          title="Recent Invoices"
          icon={FileText}
          href="/invoices"
          items={recentInvoicesActivity}
        />
        <ActivityPanel
          title="Recent Payments"
          icon={CreditCard}
          href="/payments"
          items={recentPaymentsActivity}
        />
        <ActivityPanel
          title="Recent Customers"
          icon={Users}
          href="/customers"
          items={recentCustomersActivity}
        />
        <ActivityPanel
          title="Recent Inventory Changes"
          icon={Package}
          href="/inventory"
          items={recentMovementsActivity}
        />
      </div>
    </>
  );
}
