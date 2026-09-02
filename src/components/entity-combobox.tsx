"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type EntityOption = {
  id: string;
  label: string;
  sublabel?: string;
  state?: string;
  badge?: {
    text: string;
    variant?: "default" | "warning" | "error" | "success";
  };
};

type EntityComboboxProps = {
  options: EntityOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  emptyText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
};

const badgeStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  warning: "bg-tertiary/15 text-tertiary",
  error: "bg-error/15 text-error",
  success: "bg-success/15 text-success",
};

export function EntityCombobox({
  options,
  value,
  onChange,
  placeholder,
  emptyText = "No results found.",
  isLoading = false,
  disabled = false,
  className,
}: EntityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between rounded-lg font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}…`} />
          <CommandList>
            {isLoading ? (
              <CommandItem disabled>Loading…</CommandItem>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.label} ${option.sublabel ?? ""}`}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.sublabel ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {option.sublabel}
                      </span>
                    ) : null}
                  </span>
                  {option.badge ? (
                    <span
                      className={cn(
                        "ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] leading-none font-medium",
                        badgeStyles[option.badge.variant ?? "default"]
                      )}
                    >
                      {option.badge.text}
                    </span>
                  ) : null}
                  <Check
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
