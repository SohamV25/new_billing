import { z } from "zod";
import { GSTIN_PATTERN } from "./gstin";

function clearingString(schema: z.ZodString) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    schema.optional().nullable()
  );
}

export const customerCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(200, "Customer name must be 200 characters or fewer"),
  email: clearingString(
    z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(200, "Email must be 200 characters or fewer")
  ),
  phone: clearingString(
    z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number")
  ),
  address: clearingString(
    z.string().trim().max(500, "Address must be 500 characters or fewer")
  ),
  city: clearingString(
    z.string().trim().max(100, "City must be 100 characters or fewer")
  ),
  state: clearingString(
    z.string().trim().max(100, "State must be 100 characters or fewer")
  ),
  pincode: clearingString(
    z
      .string()
      .trim()
      .regex(/^[0-9]{6}$/, "Pincode must be 6 digits")
  ),
  gstin: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? null
        : typeof value === "string"
          ? value.trim().toUpperCase()
          : value,
    z
      .string()
      .trim()
      .regex(GSTIN_PATTERN, "Enter a valid GSTIN")
      .optional()
      .nullable()
  ),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreatePayload = z.infer<typeof customerCreateSchema>;
export type CustomerUpdatePayload = z.infer<typeof customerUpdateSchema>;
