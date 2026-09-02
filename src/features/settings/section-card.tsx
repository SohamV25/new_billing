import type { ReactNode } from "react";
import { TonalCard } from "@/components/tonal-card";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <TonalCard padding="lg" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="text-body-md text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {children}
    </TonalCard>
  );
}
