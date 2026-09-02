import {
  BarChart3,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type PermissionName } from "@/config/rbac";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionName;
};

export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: ReceiptText,
    permission: PERMISSIONS.INVOICES_VIEW,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: HandCoins,
    permission: PERMISSIONS.INVOICES_VIEW,
  },
  {
    title: "Quotations",
    href: "/quotations",
    icon: FileText,
    permission: PERMISSIONS.QUOTATIONS_VIEW,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    permission: PERMISSIONS.CUSTOMERS_VIEW,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Warehouse,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
];

export const secondaryNav: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export const bottomNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: ReceiptText,
    permission: PERMISSIONS.INVOICES_VIEW,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    permission: PERMISSIONS.CUSTOMERS_VIEW,
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export const appName = "Stitch Billing";
