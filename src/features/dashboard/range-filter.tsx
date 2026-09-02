"use client";

import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RangeFilterProps = {
  value: { from?: string; to?: string };
  onChange: (patch: Partial<{ from?: string; to?: string }>) => void;
};

const PRESETS = [
  { label: "All time", value: "all" },
  { label: "This month", value: "this-month" },
  { label: "Last 30 days", value: "last-30" },
  { label: "Last 90 days", value: "last-90" },
] as const;

function getPresetDates(preset: string): { from?: string; to?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "custom":
      return {};
    case "all":
      return { from: undefined, to: undefined };
    case "this-month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: from.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    }
    case "last-30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return {
        from: from.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    }
    case "last-90": {
      const from = new Date(today);
      from.setDate(from.getDate() - 89);
      return {
        from: from.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    }
    default:
      return {};
  }
}

export function RangeFilter({ value, onChange }: RangeFilterProps) {
  const hasActiveRange = Boolean(value.from || value.to);

  const handlePresetChange = (preset: string) => {
    const dates = getPresetDates(preset);
    onChange(dates);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Select
        value={hasActiveRange ? "custom" : "all"}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger
          className="col-span-2 h-10 w-full sm:h-9 sm:w-40"
          aria-label="Date range preset"
        >
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Calendar
          className="text-on-surface-variant size-4 shrink-0"
          aria-hidden="true"
        />
        <Input
          type="date"
          value={value.from ?? ""}
          onChange={(event) =>
            onChange({ from: event.target.value || undefined })
          }
          aria-label="From date"
          className="h-10 w-full sm:h-9 sm:w-40"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Calendar
          className="text-on-surface-variant size-4 shrink-0"
          aria-hidden="true"
        />
        <Input
          type="date"
          value={value.to ?? ""}
          onChange={(event) =>
            onChange({ to: event.target.value || undefined })
          }
          aria-label="To date"
          className="h-10 w-full sm:h-9 sm:w-40"
        />
      </div>

      {hasActiveRange && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="col-span-2 h-10 sm:h-9 sm:w-auto"
          onClick={() => onChange({ from: undefined, to: undefined })}
        >
          <X className="size-4" />
          Clear range
        </Button>
      )}
    </div>
  );
}
