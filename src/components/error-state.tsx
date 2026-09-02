"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="border-border bg-surface-card flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-16 text-center">
      <div className="bg-error-container/20 flex size-12 items-center justify-center rounded-full">
        <AlertCircle className="text-error size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-headline-sm text-on-surface font-medium">
          {title}
        </h3>
        <p className="text-body-md text-on-surface-variant mx-auto max-w-sm">
          {message}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
