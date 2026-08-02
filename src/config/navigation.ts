import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Invoices", href: "/invoices", icon: ReceiptText },
  { title: "Quotations", href: "/quotations", icon: FileText },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Products", href: "/products", icon: Package },
  { title: "Reports", href: "/reports", icon: BarChart3 },
];

export const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

export const bottomNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Invoices", href: "/invoices", icon: ReceiptText },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const appName = "Stitch Billing";
