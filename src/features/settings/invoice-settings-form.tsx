"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoiceSettingsSchema } from "@/lib/validations/settings";
import { useCompanySettings, useUpdateInvoiceSettings } from "./hooks";
import type { InvoiceSettingsPayload } from "@/lib/validations/settings";

export function InvoiceSettingsForm() {
  const { data: settings, isLoading } = useCompanySettings();
  const mutation = useUpdateInvoiceSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceSettingsPayload>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      invoicePrefix: settings?.invoicePrefix ?? "INV",
      quotationPrefix: settings?.quotationPrefix ?? "QT",
      currency: settings?.currency ?? "INR",
      defaultGstRate: settings?.defaultGstRate ?? null,
      defaultTerms: settings?.defaultTerms ?? "",
    },
  });

  function onSubmit(data: InvoiceSettingsPayload) {
    mutation.mutate(data, {
      onSuccess: () => reset(data),
    });
  }

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="is-invoicePrefix">Invoice prefix</Label>
          <Input
            id="is-invoicePrefix"
            {...register("invoicePrefix")}
            className="uppercase"
          />
          {errors.invoicePrefix ? (
            <p className="text-destructive text-sm">
              {errors.invoicePrefix.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="is-quotationPrefix">Quotation prefix</Label>
          <Input
            id="is-quotationPrefix"
            {...register("quotationPrefix")}
            className="uppercase"
          />
          {errors.quotationPrefix ? (
            <p className="text-destructive text-sm">
              {errors.quotationPrefix.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="is-currency">Currency</Label>
          <Input
            id="is-currency"
            {...register("currency")}
            className="uppercase"
          />
          {errors.currency ? (
            <p className="text-destructive text-sm">
              {errors.currency.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="is-defaultGstRate">Default GST rate (%)</Label>
          <Input
            id="is-defaultGstRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register("defaultGstRate", {
              valueAsNumber: true,
            })}
          />
          {errors.defaultGstRate ? (
            <p className="text-destructive text-sm">
              {errors.defaultGstRate.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="is-defaultTerms">Default terms</Label>
          <Textarea id="is-defaultTerms" {...register("defaultTerms")} />
          {errors.defaultTerms ? (
            <p className="text-destructive text-sm">
              {errors.defaultTerms.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-border bg-surface-container-low rounded-lg p-4">
        <p className="text-body-sm text-on-surface-variant">
          <strong>Next invoice number:</strong> {settings?.invoicePrefix}
          {String(settings?.nextInvoiceNo ?? 1).padStart(4, "0")}
        </p>
        <p className="text-body-sm text-on-surface-variant mt-1">
          <strong>Next quotation number:</strong> {settings?.quotationPrefix}
          {String(settings?.nextQuotationNo ?? 1).padStart(4, "0")}
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          Sequences advance automatically when a document is created.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save settings"
        )}
      </Button>
    </form>
  );
}
