import { z } from "zod";

import { optionalString } from "@/lib/validations/helpers";

export const INVENTORY_MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT"] as const;

export const inventoryAdjustSchema = z
  .object({
    type: z.enum(INVENTORY_MOVEMENT_TYPES),
    quantity: z.coerce
      .number()
      .int("Quantity must be a whole number")
      .min(0, "Quantity cannot be negative"),
    lowStockAt: z.coerce
      .number()
      .int("Low stock threshold must be a whole number")
      .min(0, "Low stock threshold cannot be negative")
      .max(999_999, "Low stock threshold is too large")
      .optional(),
    reason: optionalString(300),
  })
  .superRefine((value, context) => {
    if (value.type !== "ADJUSTMENT" && value.quantity < 1) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantity must be at least 1 for stock movements",
      });
    }
  });

export type InventoryAdjustPayload = z.infer<typeof inventoryAdjustSchema>;

export const STOCK_STATUS_FILTERS = ["all", "in", "low", "out"] as const;

export const stockStatusFilterSchema = z.enum(STOCK_STATUS_FILTERS);

export type StockStatusFilter = z.infer<typeof stockStatusFilterSchema>;

export const MOVEMENT_TYPE_FILTERS = [
  "all",
  ...INVENTORY_MOVEMENT_TYPES,
] as const;

export const movementTypeFilterSchema = z.enum(MOVEMENT_TYPE_FILTERS);

export type MovementTypeFilter = z.infer<typeof movementTypeFilterSchema>;
