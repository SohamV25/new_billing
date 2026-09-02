import { z } from "zod";

export const dateInput = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date()
);

export const queryNumber = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.number().int().positive()
);

export const booleanInput = z.preprocess((value) => {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return undefined;
  return value;
}, z.boolean());

export const optionalUuid = z.string().uuid().optional();
