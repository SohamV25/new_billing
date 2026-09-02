import { z } from "zod";

/**
 * Optional text field shared across schemas. Empty strings from forms are
 * normalised to `undefined` so optional fields are not stored as "".
 */
export function optionalString(maxLength: number) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .max(maxLength, `Must be ${maxLength} characters or fewer`)
      .optional()
  );
}
