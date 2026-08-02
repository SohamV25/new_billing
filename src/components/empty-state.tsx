import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-surface-card flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-16 text-center",
        className
      )}
    >
      <div className="bg-surface-container-high flex size-12 items-center justify-center rounded-full">
        <Icon className="text-primary-container size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-headline-sm text-on-surface font-medium">
          {title}
        </h3>
        {description ? (
          <p className="text-body-md text-on-surface-variant mx-auto max-w-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
