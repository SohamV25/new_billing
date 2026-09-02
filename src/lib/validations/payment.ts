import { z } from "zod";

import { optionalString } from "@/lib/validations/helpers";

export const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
] as const;

const dateInput = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date()
);

const paymentFields = {
  amount: z.coerce
    .number()
    .positive("Payment amount must be greater than zero")
    .max(999_999_999.99, "Payment amount is too large"),
  method: z.enum(PAYMENT_METHODS),
  reference: optionalString(100),
  note: optionalString(300),
  paidAt: dateInput.optional(),
};

export const paymentCreateSchema = z.object(paymentFields);

export const paymentUpdateSchema = z.object(paymentFields).partial();

const queryNumber = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : z.coerce.number().safeParse(value).data,
  z.number().optional()
);

export const paymentListQuerySchema = z.object({
  method: z.enum(PAYMENT_METHODS).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  search: z.string().trim().optional(),
  page: queryNumber.optional(),
  pageSize: queryNumber.optional(),
});

export type PaymentCreatePayload = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdatePayload = z.infer<typeof paymentUpdateSchema>;
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
