"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { companyProfileSchema } from "@/lib/validations/settings";
import { useCompanySettings, useUpdateCompanyProfile } from "./hooks";
import type { CompanyProfilePayload } from "@/lib/validations/settings";

export function CompanyProfileForm() {
  const { data: settings, isLoading } = useCompanySettings();
  const mutation = useUpdateCompanyProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfilePayload>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: settings?.companyName ?? "",
      gstin: settings?.gstin ?? "",
      address: settings?.address ?? "",
      city: settings?.city ?? "",
      state: settings?.state ?? "",
      pincode: settings?.pincode ?? "",
      phone: settings?.phone ?? "",
      email: settings?.email ?? "",
      website: settings?.website ?? "",
      logoUrl: settings?.logoUrl ?? "",
    },
  });

  function onSubmit(data: CompanyProfilePayload) {
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cp-companyName">Company name</Label>
          <Input id="cp-companyName" {...register("companyName")} />
          {errors.companyName ? (
            <p className="text-destructive text-sm">
              {errors.companyName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-gstin">GSTIN</Label>
          <Input id="cp-gstin" {...register("gstin")} />
          {errors.gstin ? (
            <p className="text-destructive text-sm">{errors.gstin.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-phone">Phone</Label>
          <Input id="cp-phone" {...register("phone")} />
          {errors.phone ? (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cp-address">Address</Label>
          <Input id="cp-address" {...register("address")} />
          {errors.address ? (
            <p className="text-destructive text-sm">{errors.address.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-city">City</Label>
          <Input id="cp-city" {...register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-state">State</Label>
          <Input id="cp-state" {...register("state")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-pincode">Pincode</Label>
          <Input id="cp-pincode" {...register("pincode")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-email">Email</Label>
          <Input id="cp-email" {...register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-website">Website</Label>
          <Input id="cp-website" {...register("website")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cp-logoUrl">Logo URL</Label>
          <Input id="cp-logoUrl" {...register("logoUrl")} />
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Company logo preview"
              className="border-border mt-2 h-16 w-auto rounded border object-contain"
            />
          ) : null}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </form>
  );
}
