"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import { useCustomers } from "@/features/customers/hooks";
import { useProducts } from "@/features/products/hooks";
import {
  useCreateQuotation,
  useQuotation,
  useUpdateQuotation,
} from "@/features/quotations/hooks";
import { EntityCombobox } from "@/components/entity-combobox";
import type {
  QuotationDetail,
  QuotationItemDetail,
} from "@/features/quotations/types";

const STATUS_OPTIONS = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
type StatusValue = (typeof STATUS_OPTIONS)[number];

const quotationFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  date: z.string().min(1, "Quotation date is required"),
  validUntil: z.string().optional(),
  status: z.enum(STATUS_OPTIONS),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or fewer")
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z
          .string()
          .trim()
          .min(1, "Item description is required")
          .max(500, "Item description must be 500 characters or fewer"),
        quantity: z
          .string()
          .refine(
            (value) => Number(value) > 0,
            "Quantity must be greater than zero"
          ),
        unitPrice: z
          .string()
          .refine(
            (value) => Number(value) >= 0,
            "Unit price cannot be negative"
          ),
        gstRate: z
          .string()
          .refine(
            (value) => Number(value) >= 0 && Number(value) <= 100,
            "GST must be between 0 and 100"
          ),
      })
    )
    .min(1, "Add at least one item"),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

function emptyItem() {
  return {
    productId: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
    gstRate: "0",
  };
}

function emptyValues(): QuotationFormValues {
  return {
    customerId: "",
    date: toDateInput(new Date()),
    validUntil: "",
    status: "DRAFT",
    notes: "",
    items: [emptyItem()],
  };
}

function toDateInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function combinedGstRate(item: QuotationItemDetail): string {
  const igstRate = Number(item.igstRate);
  if (igstRate > 0) return item.igstRate;
  return String(Number(item.cgstRate) * 2);
}

function fromDetail(quotation: QuotationDetail): QuotationFormValues {
  return {
    customerId: quotation.customer.id,
    date: toDateInput(quotation.date),
    validUntil: quotation.validUntil ? toDateInput(quotation.validUntil) : "",
    status:
      quotation.storedStatus === "CONVERTED"
        ? "DRAFT"
        : (quotation.storedStatus as StatusValue),
    notes: quotation.notes ?? "",
    items: quotation.items.map((item) => ({
      productId: item.productId ?? "",
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstRate: combinedGstRate(item),
    })),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeSummary(
  items: QuotationFormValues["items"],
  isIntraState: boolean
) {
  let subTotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const item of items) {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const rate = Number(item.gstRate) || 0;
    const amount = round2(quantity * unitPrice);
    subTotal += amount;
    if (isIntraState) {
      const cgstRate = rate / 2;
      totalCgst += round2((amount * cgstRate) / 100);
      totalSgst += round2((amount * cgstRate) / 100);
    } else {
      totalIgst += round2((amount * rate) / 100);
    }
  }

  const cgst = round2(totalCgst);
  const sgst = round2(totalSgst);
  const igst = round2(totalIgst);
  return {
    subTotal: round2(subTotal),
    cgst,
    sgst,
    igst,
    total: round2(subTotal + cgst + sgst + igst),
  };
}

type QuotationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string | null;
  companyState?: string | null;
};

export function QuotationFormDialog({
  open,
  onOpenChange,
  quotationId,
  companyState,
}: QuotationFormDialogProps) {
  const isEdit = quotationId !== null;
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const isPending = createQuotation.isPending || updateQuotation.isPending;

  const customersQuery = useCustomers({ page: 1, pageSize: 200 });
  const productsQuery = useProducts({ page: 1, pageSize: 200 });
  const quotationQuery = useQuotation(quotationId ?? "");

  const customerOptions = useMemo(
    () =>
      (customersQuery.data?.items ?? []).map((customer) => ({
        id: customer.id,
        label: customer.name,
        sublabel: customer.phone ?? customer.city ?? undefined,
      })),
    [customersQuery.data]
  );

  const productOptions = useMemo(
    () =>
      (productsQuery.data?.items ?? []).map((product) => {
        const stock = product.inventory?.quantity ?? 0;
        const lowStockAt = product.inventory?.lowStockAt ?? 5;
        let badge:
          | {
              text: string;
              variant: "default" | "warning" | "error" | "success";
            }
          | undefined;
        if (stock === 0) {
          badge = { text: "Out of stock", variant: "error" };
        } else if (stock <= lowStockAt) {
          badge = { text: `${stock} left`, variant: "warning" };
        }
        const parts: string[] = [];
        if (product.hsn) parts.push(`HSN: ${product.hsn}`);
        if (product.sku) parts.push(`SKU: ${product.sku}`);
        if (product.barcode) parts.push(`Barcode: ${product.barcode}`);
        parts.push(formatMoney(product.price));
        return {
          id: product.id,
          label: product.name,
          sublabel: parts.join(" · "),
          badge,
        };
      }),
    [productsQuery.data]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: emptyValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (quotationQuery.data) {
        reset(fromDetail(quotationQuery.data));
      }
    } else {
      reset(emptyValues());
    }
  }, [open, isEdit, quotationQuery.data, reset]);

  const watchedCustomerId = watch("customerId");
  const watchedItems = watch("items");

  const watchedCustomerState = useMemo(() => {
    const customer = (customersQuery.data?.items ?? []).find(
      (c) => c.id === watchedCustomerId
    );
    return customer?.state ?? null;
  }, [watchedCustomerId, customersQuery.data]);

  const isIntraState = useMemo(() => {
    if (!watchedCustomerState || !companyState) return true;
    return (
      watchedCustomerState.trim().toLowerCase() ===
      companyState.trim().toLowerCase()
    );
  }, [watchedCustomerState, companyState]);

  const summary = useMemo(
    () => computeSummary(watchedItems ?? [], isIntraState),
    [watchedItems, isIntraState]
  );

  function selectProduct(index: number, productId: string) {
    const product = (productsQuery.data?.items ?? []).find(
      (entry) => entry.id === productId
    );
    setValue(`items.${index}.productId`, productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
      setValue(`items.${index}.gstRate`, product.gstRate);
    }
  }

  function removeItem(index: number) {
    if (fields.length === 1) {
      setValue("items.0.description", "");
      setValue("items.0.quantity", "1");
      setValue("items.0.unitPrice", "0");
      setValue("items.0.gstRate", "0");
      setValue("items.0.productId", "");
      return;
    }
    remove(index);
  }

  async function onSubmit(values: QuotationFormValues) {
    const payload = {
      customerId: values.customerId,
      date: new Date(`${values.date}T00:00:00`),
      validUntil: values.validUntil
        ? new Date(`${values.validUntil}T00:00:00`)
        : null,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      items: values.items.map((item) => ({
        productId: item.productId || undefined,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        gstRate: Number(item.gstRate),
      })),
    };

    if (quotationId) {
      await updateQuotation.mutateAsync({ id: quotationId, input: payload });
    } else {
      await createQuotation.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const editingIsLoading = isEdit && quotationQuery.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit quotation" : "New quotation"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the quotation details. Totals are recalculated automatically."
              : "Create a detailed estimate for your customer."}
          </DialogDescription>
        </DialogHeader>

        {editingIsLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="quotation-customer">Customer</Label>
                <EntityCombobox
                  options={customerOptions}
                  value={watch("customerId")}
                  onChange={(id) => setValue("customerId", id)}
                  placeholder="Select customer…"
                  emptyText="No customers found."
                  isLoading={customersQuery.isPending}
                />
                {errors.customerId ? (
                  <p className="text-body-md text-error" role="alert">
                    {errors.customerId.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="quotation-date">Quotation date</Label>
                  <Input
                    id="quotation-date"
                    type="date"
                    aria-invalid={Boolean(errors.date)}
                    {...register("date")}
                  />
                  {errors.date ? (
                    <p className="text-body-md text-error" role="alert">
                      {errors.date.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quotation-valid-until">Valid until</Label>
                  <Input
                    id="quotation-valid-until"
                    type="date"
                    {...register("validUntil")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quotation-status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    setValue("status", value as StatusValue)
                  }
                >
                  <SelectTrigger
                    id="quotation-status"
                    className="w-full sm:w-56"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm text-on-surface font-medium">
                  Items
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append(emptyItem())}
                >
                  <Plus />
                  Add item
                </Button>
              </div>

              {fields.map((field, index) => {
                const itemErrors = errors.items?.[index];
                const quantity = Number(watch(`items.${index}.quantity`)) || 0;
                const unitPrice =
                  Number(watch(`items.${index}.unitPrice`)) || 0;
                const amount = round2(quantity * unitPrice);

                return (
                  <div
                    key={field.id}
                    className="border-border bg-surface-container-low rounded-xl border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <EntityCombobox
                            options={productOptions}
                            value={watch(`items.${index}.productId`) ?? ""}
                            onChange={(id) => selectProduct(index, id)}
                            placeholder="Select product…"
                            emptyText="No products found."
                            isLoading={productsQuery.isPending}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Input
                            placeholder="Item description"
                            aria-invalid={Boolean(itemErrors?.description)}
                            {...register(`items.${index}.description`)}
                          />
                          {itemErrors?.description ? (
                            <p className="text-body-md text-error" role="alert">
                              {itemErrors.description.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label>Qty</Label>
                            <Input
                              inputMode="decimal"
                              aria-invalid={Boolean(itemErrors?.quantity)}
                              {...register(`items.${index}.quantity`)}
                            />
                            {itemErrors?.quantity ? (
                              <p
                                className="text-body-md text-error"
                                role="alert"
                              >
                                {itemErrors.quantity.message}
                              </p>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <Label>Unit price</Label>
                            <Input
                              inputMode="decimal"
                              aria-invalid={Boolean(itemErrors?.unitPrice)}
                              {...register(`items.${index}.unitPrice`)}
                            />
                            {itemErrors?.unitPrice ? (
                              <p
                                className="text-body-md text-error"
                                role="alert"
                              >
                                {itemErrors.unitPrice.message}
                              </p>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <Label>GST %</Label>
                            <Input
                              inputMode="decimal"
                              aria-invalid={Boolean(itemErrors?.gstRate)}
                              {...register(`items.${index}.gstRate`)}
                            />
                            {itemErrors?.gstRate ? (
                              <p
                                className="text-body-md text-error"
                                role="alert"
                              >
                                {itemErrors.gstRate.message}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeItem(index)}
                          aria-label="Remove item"
                        >
                          <Trash2 />
                        </Button>
                        <p className="font-geist text-mono-sm text-on-surface font-semibold">
                          {formatMoney(amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {errors.items?.root?.message ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.items.root.message}
                </p>
              ) : null}
              {errors.items?.message ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.items.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quotation-notes">Notes & terms</Label>
              <Textarea
                id="quotation-notes"
                rows={3}
                placeholder="Specify any additional terms…"
                {...register("notes")}
              />
            </div>

            <div className="border-border bg-surface-container-high rounded-xl border border-dashed p-5">
              <div className="text-body-md text-on-surface-variant flex justify-between">
                <span>Subtotal</span>
                <span className="font-geist text-mono-sm">
                  {formatMoney(summary.subTotal)}
                </span>
              </div>
              <div className="text-body-md text-on-surface-variant mt-2 flex justify-between">
                <span>CGST</span>
                <span className="font-geist text-mono-sm">
                  {formatMoney(summary.cgst)}
                </span>
              </div>
              <div className="text-body-md text-on-surface-variant mt-2 flex justify-between">
                <span>SGST</span>
                <span className="font-geist text-mono-sm">
                  {formatMoney(summary.sgst)}
                </span>
              </div>
              <div className="bg-outline-variant my-3 h-px" />
              <div className="text-headline-sm text-on-surface flex justify-between font-bold">
                <span>Total Amount</span>
                <span className="font-geist text-mono-sm text-primary">
                  {formatMoney(summary.total)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Save quotation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
