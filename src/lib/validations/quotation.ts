import { z } from "zod";

import { optionalString } from "@/lib/validations/helpers";

/**
 * Statuses the user can set directly on a quotation. EXPIRED and CONVERTED are
 * system-computed (EXPIRED on read, CONVERTED only via conversion) and are
 * never accepted from the client.
 */
export const quotationStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
]);

const dateInput = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date()
);

export const quotationItemSchema = z.object({
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
  gstRate: z.coerce
    .number()
    .min(0, "GST rate cannot be negative")
    .max(100, "GST rate cannot exceed 100"),
});

export const quotationCreateSchema = z.object({
  customerId: z.string().uuid("Select a customer"),
  date: dateInput,
  validUntil: dateInput.nullable().optional(),
  status: quotationStatusSchema.default("DRAFT"),
  notes: optionalString(2000),
  items: z
    .array(quotationItemSchema)
    .min(1, "Add at least one item")
    .max(100, "A quotation cannot have more than 100 items"),
});

export const quotationUpdateSchema = z
  .object({
    customerId: z.string().uuid("Select a customer"),
    date: dateInput,
    validUntil: dateInput.nullable().optional(),
    status: quotationStatusSchema,
    notes: optionalString(2000),
    items: z
      .array(quotationItemSchema)
      .min(1, "Add at least one item")
      .max(100, "A quotation cannot have more than 100 items"),
  })
  .partial();

export const quotationDuplicateSchema = z.object({
  status: quotationStatusSchema.default("DRAFT"),
});

export const quotationConvertSchema = z.object({
  orderNo: optionalString(100),
  orderDate: dateInput.nullable().optional(),
  dcNo: optionalString(100),
  dcDate: dateInput.nullable().optional(),
});

export type QuotationStatusPayload = z.infer<typeof quotationStatusSchema>;
export type QuotationItemPayload = z.infer<typeof quotationItemSchema>;
export type QuotationCreatePayload = z.infer<typeof quotationCreateSchema>;
export type QuotationUpdatePayload = z.infer<typeof quotationUpdateSchema>;
export type QuotationDuplicatePayload = z.infer<
  typeof quotationDuplicateSchema
>;
export type QuotationConvertPayload = z.infer<typeof quotationConvertSchema>;
