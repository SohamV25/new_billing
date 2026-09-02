import { z } from "zod";

import { dateInput } from "./query-helpers";

export const dashboardQuerySchema = z
  .object({
    from: dateInput.optional(),
    to: dateInput.optional(),
    topN: z.coerce.number().int().min(1).max(50).optional(),
    granularity: z.enum(["week", "month", "quarter", "year"]).optional(),
  })
  .refine((q) => !q.from || !q.to || q.from.getTime() <= q.to.getTime(), {
    message: "From date must be on or before the to date.",
    path: ["to"],
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export function dashboardQueryFromParams(searchParams: URLSearchParams) {
  return dashboardQuerySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    topN: searchParams.get("topN") ?? undefined,
    granularity: searchParams.get("granularity") ?? undefined,
  });
}
