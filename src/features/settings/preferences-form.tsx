"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { preferencesSchema } from "@/lib/validations/settings";
import { usePreferences, useUpdatePreferences } from "./hooks";
import { formatDateTimeFor, formatDateFor } from "@/lib/format";
import type { PreferencesPayload } from "@/lib/validations/settings";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kathmandu",
  "Europe/London",
  "Europe/Berlin",
  "US/Eastern",
  "US/Central",
  "US/Pacific",
  "UTC",
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export function PreferencesForm() {
  const { data: prefs, isLoading } = usePreferences();
  const mutation = useUpdatePreferences();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PreferencesPayload>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: "DARK",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
    },
  });

  const watchedTheme = watch("theme");
  const watchedTimezone = watch("timezone");
  const watchedDateFormat = watch("dateFormat");

  function onSubmit(data: PreferencesPayload) {
    mutation.mutate(data, {
      onSuccess: () => {
        reset({
          theme: data.theme,
          timezone: data.timezone,
          dateFormat: data.dateFormat,
        });
      },
    });
  }

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  const sampleDate = new Date();
  const currentPrefs = prefs ?? {
    theme: "DARK",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="pref-theme">Theme</Label>
          <Select
            {...register("theme")}
            onValueChange={(value) =>
              reset({
                theme: value as "LIGHT" | "DARK" | "SYSTEM",
                timezone: currentPrefs.timezone,
                dateFormat: currentPrefs.dateFormat as
                  "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD",
              })
            }
          >
            <SelectTrigger id="pref-theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIGHT">Light</SelectItem>
              <SelectItem value="DARK">Dark</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pref-timezone">Timezone</Label>
          <Select
            {...register("timezone")}
            onValueChange={(value) =>
              reset({
                theme: (prefs?.theme ?? "DARK") as "LIGHT" | "DARK" | "SYSTEM",
                timezone: value,
                dateFormat: (prefs?.dateFormat ?? "DD/MM/YYYY") as
                  "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD",
              })
            }
          >
            <SelectTrigger id="pref-timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pref-dateformat">Date format</Label>
          <Select
            {...register("dateFormat")}
            onValueChange={(value) =>
              reset({
                theme: (prefs?.theme ?? "DARK") as "LIGHT" | "DARK" | "SYSTEM",
                timezone: prefs?.timezone ?? "Asia/Kolkata",
                dateFormat: value as "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD",
              })
            }
          >
            <SelectTrigger id="pref-dateformat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((df) => (
                <SelectItem key={df.value} value={df.value}>
                  {df.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-border bg-surface-container-low rounded-lg p-4">
        <p className="text-body-sm text-on-surface-variant mb-2">
          Live preview
        </p>
        <p className="text-body-md text-on-surface font-medium">
          {formatDateFor(sampleDate, {
            timeZone: watchedTimezone,
            format: watchedDateFormat,
          })}{" "}
          —{" "}
          {formatDateTimeFor(sampleDate, {
            timeZone: watchedTimezone,
            format: watchedDateFormat,
          })}
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save preferences"
        )}
      </Button>
    </form>
  );
}
