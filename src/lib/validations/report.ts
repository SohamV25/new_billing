import { z } from "zod";

import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/validations/payment";
import {
  dateInput,
  queryNumber,
  booleanInput,
  optionalUuid,
} from "./query-helpers";

export const REPORT_TYPES = [
  "sales",
  "payments",
  "tax",
  "customers",
  "products",
  "inventory",
  "outstanding",
  "top-products",
  "top-customers",
  "revenue-trends",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_GRANULARITIES = ["auto", "day", "week", "month"] as const;

export type ReportGranularity = (typeof REPORT_GRANULARITIES)[number];

const baseFields = {
  from: dateInput.optional(),
  to: dateInput.optional(),
  page: queryNumber.optional(),
  pageSize: queryNumber.optional(),
};

const salesQuerySchema = z.object({
  type: z.literal("sales"),
  ...baseFields,
  customerId: optionalUuid,
  status: z.enum(["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"]).optional(),
  search: z.string().trim().optional(),
});

const paymentsQuerySchema = z.object({
  type: z.literal("payments"),
  ...baseFields,
  customerId: optionalUuid,
  method: z.enum(PAYMENT_METHODS).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  search: z.string().trim().optional(),
});

const taxQuerySchema = z.object({
  type: z.literal("tax"),
  ...baseFields,
  customerId: optionalUuid,
});

const customersQuerySchema = z.object({
  type: z.literal("customers"),
  ...baseFields,
  search: z.string().trim().optional(),
});

const productsQuerySchema = z.object({
  type: z.literal("products"),
  ...baseFields,
  search: z.string().trim().optional(),
});

const inventoryQuerySchema = z.object({
  type: z.literal("inventory"),
  ...baseFields,
  status: z.enum(["in", "low", "out"]).optional(),
});

const outstandingQuerySchema = z.object({
  type: z.literal("outstanding"),
  ...baseFields,
  customerId: optionalUuid,
  overdueOnly: booleanInput.optional(),
  search: z.string().trim().optional(),
});

const topProductsQuerySchema = z.object({
  type: z.literal("top-products"),
  ...baseFields,
  topN: z.coerce.number().int().min(1).max(50).optional(),
});

const topCustomersQuerySchema = z.object({
  type: z.literal("top-customers"),
  ...baseFields,
  topN: z.coerce.number().int().min(1).max(50).optional(),
});

const revenueTrendsQuerySchema = z.object({
  type: z.literal("revenue-trends"),
  ...baseFields,
  granularity: z.enum(REPORT_GRANULARITIES).optional(),
});

export const reportQuerySchema = z
  .discriminatedUnion("type", [
    salesQuerySchema,
    paymentsQuerySchema,
    taxQuerySchema,
    customersQuerySchema,
    productsQuerySchema,
    inventoryQuerySchema,
    outstandingQuerySchema,
    topProductsQuerySchema,
    topCustomersQuerySchema,
    revenueTrendsQuerySchema,
  ])
  .refine(
    (query) =>
      !query.from || !query.to || query.from.getTime() <= query.to.getTime(),
    {
      message: "From date must be on or before the to date.",
      path: ["to"],
    }
  );

export type ReportQuery = z.infer<typeof reportQuerySchema>;

/**
 * Parses a report query from an API/search-params query string. Unknown keys
 * (e.g. `autoprint`) are ignored so the same parser serves the API routes and
 * the print page.
 */
export function reportQueryFromParams(searchParams: URLSearchParams) {
  return reportQuerySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    method: searchParams.get("method") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    topN: searchParams.get("topN") ?? undefined,
    granularity: searchParams.get("granularity") ?? undefined,
    overdueOnly: searchParams.get("overdueOnly") ?? undefined,
  });
}
