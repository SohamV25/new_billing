import { z } from "zod";

import { optionalString } from "@/lib/validations/helpers";

export const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or fewer"),
  barcode: optionalString(100),
  sku: optionalString(100),
  hsn: optionalString(100),
  unit: optionalString(20),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(999_999_999.99, "Price is too large"),
  gstRate: z.coerce
    .number()
    .min(0, "GST rate cannot be negative")
    .max(100, "GST rate cannot exceed 100"),
  initialStock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .default(0),
  lowStockAt: z.coerce
    .number()
    .int("Low stock threshold must be a whole number")
    .min(0, "Low stock threshold cannot be negative")
    .default(5),
});

export const productUpdateSchema = productCreateSchema
  .omit({ initialStock: true, lowStockAt: true })
  .partial();

export type ProductCreatePayload = z.infer<typeof productCreateSchema>;
export type ProductUpdatePayload = z.infer<typeof productUpdateSchema>;
