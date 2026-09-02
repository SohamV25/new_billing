import { z } from "zod";

import { optionalString } from "@/lib/validations/helpers";

const dateInput = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date()
);

export const invoiceItemSchema = z.object({
  productId: z.string().uuid("Select a product").nullable().optional(),
  description: z
    .string()
    .trim()
    .min(1, "Item description is required")
    .max(500, "Item description must be 500 characters or fewer"),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than zero")
    .max(999_999.999, "Quantity is too large"),
  unitPrice: z.coerce
    .number()
    .min(0, "Unit price cannot be negative")
    .max(999_999_999.99, "Unit price is too large"),
  discount: z.coerce
    .number()
    .min(0, "Discount cannot be negative")
    .max(999_999_999.99, "Discount is too large")
    .optional(),
  cgstRate: z.coerce
    .number()
    .min(0, "CGST rate cannot be negative")
    .max(100, "CGST rate cannot exceed 100"),
  sgstRate: z.coerce
    .number()
    .min(0, "SGST rate cannot be negative")
    .max(100, "SGST rate cannot exceed 100"),
  igstRate: z.coerce
    .number()
    .min(0, "IGST rate cannot be negative")
    .max(100, "IGST rate cannot exceed 100"),
});

const invoiceBaseSchema = {
  customerId: z.string().uuid("Select a customer"),
  invoiceDate: dateInput,
  dueDate: dateInput.nullable().optional(),
  orderNo: optionalString(100),
  orderDate: dateInput.nullable().optional(),
  dcNo: optionalString(100),
  dcDate: dateInput.nullable().optional(),
  notes: optionalString(2000),
  terms: optionalString(4000),
  extraReason: optionalString(200),
  extraCharges: z.coerce
    .number()
    .min(-999_999_999.99, "Extra charges are too low")
    .max(999_999_999.99, "Extra charges are too high")
    .optional(),
};

export const invoiceCreateSchema = z.object({
  ...invoiceBaseSchema,
  items: z
    .array(invoiceItemSchema)
    .min(1, "Add at least one item")
    .max(100, "An invoice cannot have more than 100 items"),
});

export const invoiceUpdateSchema = z
  .object({
    ...invoiceBaseSchema,
    items: z
      .array(invoiceItemSchema)
      .min(1, "Add at least one item")
      .max(100, "An invoice cannot have more than 100 items"),
  })
  .partial();

export type InvoiceItemPayload = z.infer<typeof invoiceItemSchema>;
export type InvoiceCreatePayload = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdatePayload = z.infer<typeof invoiceUpdateSchema>;
