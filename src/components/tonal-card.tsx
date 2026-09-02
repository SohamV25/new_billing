import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single card surface for the app. Hierarchy comes from tone, not shadow
 * (see design_references/technical_precision/DESIGN.md). Every card, panel and
 * table shell should go through this rather than repeating the class string.
 */
type TonalCardVariant = "default" | "elevated" | "sunken" | "outlined";
type TonalCardPadding = "none" | "sm" | "md" | "lg" | "xl";

interface TonalCardProps {
  children: ReactNode;
  variant?: TonalCardVariant;
  padding?: TonalCardPadding;
  as?: "div" | "section" | "article";
  className?: string;
  role?: string;
  "aria-label"?: string;
}

const variantStyles: Record<TonalCardVariant, string> = {
  default: "bg-surface-container border-outline-variant",
  elevated: "bg-surface-container-high border-outline-variant",
  sunken: "bg-surface-container-low border-outline-variant",
  outlined: "bg-transparent border-outline-variant",
};

const paddingStyles: Record<TonalCardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
  xl: "p-6 sm:p-8",
};

export function TonalCard({
  children,
  variant = "default",
  padding = "lg",
  as: Component = "div",
  className,
  ...rest
}: TonalCardProps) {
  return (
    <Component
      className={cn(
        "rounded-2xl border transition-colors",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
