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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { useCompanySettings } from "@/features/settings/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { useProducts } from "@/features/products/hooks";
import { EntityCombobox } from "@/components/entity-combobox";
import {
  useCreateInvoice,
  useInvoice,
  useUpdateInvoice,
} from "@/features/invoices/hooks";
import type { InvoiceDetail } from "@/features/invoices/types";

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional(),
  orderNo: z
    .string()
    .max(100, "Order number must be 100 characters or fewer")
    .optional(),
  orderDate: z.string().optional(),
  dcNo: z
    .string()
    .max(100, "DC number must be 100 characters or fewer")
    .optional(),
  dcDate: z.string().optional(),
  extraReason: z
    .string()
    .trim()
    .max(200, "Reason must be 200 characters or fewer")
    .optional(),
  extraCharges: z
    .string()
    .refine(
      (value) => value === "" || Number(value) >= 0,
      "Charges cannot be negative"
    )
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
        cgstRate: z
          .string()
          .refine(
            (value) => Number(value) >= 0 && Number(value) <= 100,
            "CGST rate must be between 0 and 100"
          ),
        sgstRate: z
          .string()
          .refine(
            (value) => Number(value) >= 0 && Number(value) <= 100,
            "SGST rate must be between 0 and 100"
          ),
        igstRate: z
          .string()
          .refine(
            (value) => Number(value) >= 0 && Number(value) <= 100,
            "IGST rate must be between 0 and 100"
          ),
      })
    )
    .min(1, "Add at least one item"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

function emptyItem(): InvoiceFormValues["items"][number] {
  return {
    productId: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
    cgstRate: "9",
    sgstRate: "9",
    igstRate: "0",
  };
}

function emptyValues(): InvoiceFormValues {
  return {
    customerId: "",
    invoiceDate: toDateInput(new Date()),
    dueDate: toDateInput(new Date()),
    orderNo: "",
    orderDate: "",
    dcNo: "",
    dcDate: "",
    extraReason: "",
    extraCharges: "",
    items: [emptyItem()],
  };
}

function toDateInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function fromDetail(invoice: InvoiceDetail): InvoiceFormValues {
  return {
    customerId: invoice.customer.id,
    invoiceDate: toDateInput(invoice.invoiceDate),
    dueDate: invoice.dueDate ? toDateInput(invoice.dueDate) : "",
    orderNo: invoice.orderNo ?? "",
    orderDate: invoice.orderDate ? toDateInput(invoice.orderDate) : "",
    dcNo: invoice.dcNo ?? "",
    dcDate: invoice.dcDate ? toDateInput(invoice.dcDate) : "",
    extraReason: invoice.extraReason ?? "",
    extraCharges: invoice.extraCharges
      ? String(Number(invoice.extraCharges))
      : "",
    items: invoice.items.map((item) => ({
      productId: item.productId ?? "",
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      cgstRate: String(Number(item.cgstRate) || 0),
      sgstRate: String(Number(item.sgstRate) || 0),
      igstRate: String(Number(item.igstRate) || 0),
    })),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeSummary(
  items: InvoiceFormValues["items"],
  extraCharges: string | undefined
) {
  let subTotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const item of items) {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const taxableAmount = round2(quantity * unitPrice);
    const cgstRate = Number(item.cgstRate) || 0;
    const sgstRate = Number(item.sgstRate) || 0;
    const igstRate = Number(item.igstRate) || 0;

    const cgstAmount = round2((taxableAmount * cgstRate) / 100);
    const sgstAmount = round2((taxableAmount * sgstRate) / 100);
    const igstAmount = round2((taxableAmount * igstRate) / 100);

    subTotal += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
  }

  const extra = round2(Number(extraCharges) || 0);
  const cgst = round2(totalCgst);
  const sgst = round2(totalSgst);
  const igst = round2(totalIgst);
  return {
    subTotal: round2(subTotal),
    cgst,
    sgst,
    igst,
    totalTax: round2(cgst + sgst + igst),
    extra,
    total: round2(subTotal + cgst + sgst + igst + extra),
  };
}

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceFormDialogProps) {
  const isEdit = invoiceId !== null;
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const isPending = createInvoice.isPending || updateInvoice.isPending;

  const customersQuery = useCustomers({ page: 1, pageSize: 200 });
  const productsQuery = useProducts({ page: 1, pageSize: 200 });
  const invoiceQuery = useInvoice(invoiceId ?? "");
  const companySettingsQuery = useCompanySettings();

  const companyState = companySettingsQuery.data?.state ?? null;

  const customerOptions = useMemo(
    () =>
      (customersQuery.data?.items ?? []).map((customer) => ({
        id: customer.id,
        label: customer.name,
        sublabel: customer.phone ?? customer.city ?? undefined,
        state: customer.state ?? undefined,
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
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (invoiceQuery.data) {
        reset(fromDetail(invoiceQuery.data));
      }
    } else {
      reset(emptyValues());
    }
  }, [open, isEdit, invoiceQuery.data, reset]);

  const watchedCustomerId = watch("customerId");
  const watchedItems = watch("items");
  const watchedExtra = watch("extraCharges");
  const watchedExtraReason = watch("extraReason");

  const watchedCustomerState = useMemo(() => {
    if (!watchedCustomerId) return null;
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
    () => computeSummary(watchedItems ?? [], watchedExtra),
    [watchedItems, watchedExtra]
  );

  function setGstRatesForItem(index: number, gstRate: number) {
    if (isIntraState) {
      setValue(`items.${index}.cgstRate`, String(gstRate / 2));
      setValue(`items.${index}.sgstRate`, String(gstRate / 2));
      setValue(`items.${index}.igstRate`, "0");
    } else {
      setValue(`items.${index}.cgstRate`, "0");
      setValue(`items.${index}.sgstRate`, "0");
      setValue(`items.${index}.igstRate`, String(gstRate));
    }
  }

  function selectProduct(index: number, productId: string) {
    const product = (productsQuery.data?.items ?? []).find(
      (entry) => entry.id === productId
    );
    setValue(`items.${index}.productId`, productId);
    if (product) {
      setValue(`items.${index}.description`, product.name);
      setValue(`items.${index}.unitPrice`, product.price);
      setGstRatesForItem(index, Number(product.gstRate) || 0);
    }
  }

  function removeItem(index: number) {
    if (fields.length === 1) {
      setValue("items.0.description", "");
      setValue("items.0.quantity", "1");
      setValue("items.0.unitPrice", "0");
      setValue("items.0.cgstRate", "9");
      setValue("items.0.sgstRate", "9");
      setValue("items.0.igstRate", "0");
      setValue("items.0.productId", "");
      return;
    }
    remove(index);
  }

  async function onSubmit(values: InvoiceFormValues) {
    const payload = {
      customerId: values.customerId,
      invoiceDate: new Date(`${values.invoiceDate}T00:00:00`),
      dueDate: values.dueDate
        ? new Date(`${values.dueDate}T00:00:00`)
        : undefined,
      orderNo: values.orderNo?.trim() || undefined,
      orderDate: values.orderDate
        ? new Date(`${values.orderDate}T00:00:00`)
        : undefined,
      dcNo: values.dcNo?.trim() || undefined,
      dcDate: values.dcDate ? new Date(`${values.dcDate}T00:00:00`) : undefined,
      extraCharges: values.extraCharges?.trim()
        ? Number(values.extraCharges)
        : undefined,
      extraReason: values.extraReason?.trim() || undefined,
      items: values.items.map((item) => ({
        productId: item.productId || undefined,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        cgstRate: Number(item.cgstRate),
        sgstRate: Number(item.sgstRate),
        igstRate: Number(item.igstRate),
      })),
    };

    if (invoiceId) {
      await updateInvoice.mutateAsync({ id: invoiceId, input: payload });
    } else {
      await createInvoice.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const editingIsLoading = isEdit && invoiceQuery.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit invoice" : "New invoice"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the invoice details. Totals are recalculated automatically."
              : "Create an invoice for your customer."}
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
            {/* Customer & Dates */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-customer">Customer</Label>
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
                  <Label htmlFor="invoice-date">Invoice date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    aria-invalid={Boolean(errors.invoiceDate)}
                    {...register("invoiceDate")}
                  />
                  {errors.invoiceDate ? (
                    <p className="text-body-md text-error" role="alert">
                      {errors.invoiceDate.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-due-date">Payment due date</Label>
                  <Input
                    id="invoice-due-date"
                    type="date"
                    aria-invalid={Boolean(errors.dueDate)}
                    {...register("dueDate")}
                  />
                  {errors.dueDate ? (
                    <p className="text-body-md text-error" role="alert">
                      {errors.dueDate.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-order-no">Order number</Label>
                  <Input
                    id="invoice-order-no"
                    placeholder="e.g. ORD-001"
                    {...register("orderNo")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-order-date">Order date</Label>
                  <Input
                    id="invoice-order-date"
                    type="date"
                    {...register("orderDate")}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-dc-no">DC number</Label>
                  <Input
                    id="invoice-dc-no"
                    placeholder="e.g. DC-001"
                    {...register("dcNo")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-dc-date">DC date</Label>
                  <Input
                    id="invoice-dc-date"
                    type="date"
                    {...register("dcDate")}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
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
                const taxableAmount = round2(quantity * unitPrice);
                const cgstRate = Number(watch(`items.${index}.cgstRate`)) || 0;
                const sgstRate = Number(watch(`items.${index}.sgstRate`)) || 0;
                const igstRate = Number(watch(`items.${index}.igstRate`)) || 0;
                const cgstAmount = round2((taxableAmount * cgstRate) / 100);
                const sgstAmount = round2((taxableAmount * sgstRate) / 100);
                const igstAmount = round2((taxableAmount * igstRate) / 100);
                const lineTotal = round2(
                  taxableAmount + cgstAmount + sgstAmount + igstAmount
                );
                const selectedProductId = watch(`items.${index}.productId`);
                const selectedProduct = selectedProductId
                  ? (productsQuery.data?.items ?? []).find(
                      (p) => p.id === selectedProductId
                    )
                  : null;
                const availableStock =
                  selectedProduct?.inventory?.quantity ?? null;
                const isFractional =
                  selectedProduct && !Number.isInteger(quantity);
                const exceedsStock =
                  availableStock !== null && quantity > availableStock;

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
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                            ) : exceedsStock ? (
                              <p className="text-body-md text-warning">
                                Only {availableStock} in stock
                              </p>
                            ) : isFractional ? (
                              <p className="text-body-md text-warning">
                                Must be a whole number
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
                          <div className="flex flex-col justify-end space-y-1">
                            <Label>Taxable</Label>
                            <p className="font-geist text-mono-sm text-on-surface font-semibold">
                              {formatMoney(taxableAmount)}
                            </p>
                          </div>
                        </div>

                        {/* GST Rate Fields */}
                        <div className="border-outline-variant bg-surface-container rounded-lg border p-3">
                          <p className="text-label-md text-on-surface-variant mb-2 font-medium">
                            GST Rates
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-label-md">CGST %</Label>
                              <Input
                                inputMode="decimal"
                                aria-invalid={Boolean(itemErrors?.cgstRate)}
                                {...register(`items.${index}.cgstRate`)}
                              />
                              {itemErrors?.cgstRate ? (
                                <p
                                  className="text-body-md text-error"
                                  role="alert"
                                >
                                  {itemErrors.cgstRate.message}
                                </p>
                              ) : null}
                              <p className="font-geist text-mono-sm text-on-surface-variant">
                                {formatMoney(cgstAmount)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-label-md">SGST %</Label>
                              <Input
                                inputMode="decimal"
                                aria-invalid={Boolean(itemErrors?.sgstRate)}
                                {...register(`items.${index}.sgstRate`)}
                              />
                              {itemErrors?.sgstRate ? (
                                <p
                                  className="text-body-md text-error"
                                  role="alert"
                                >
                                  {itemErrors.sgstRate.message}
                                </p>
                              ) : null}
                              <p className="font-geist text-mono-sm text-on-surface-variant">
                                {formatMoney(sgstAmount)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-label-md">IGST %</Label>
                              <Input
                                inputMode="decimal"
                                aria-invalid={Boolean(itemErrors?.igstRate)}
                                {...register(`items.${index}.igstRate`)}
                              />
                              {itemErrors?.igstRate ? (
                                <p
                                  className="text-body-md text-error"
                                  role="alert"
                                >
                                  {itemErrors.igstRate.message}
                                </p>
                              ) : null}
                              <p className="font-geist text-mono-sm text-on-surface-variant">
                                {formatMoney(igstAmount)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="border-outline-variant flex items-center justify-end gap-2 border-t pt-2">
                          <span className="text-label-md text-on-surface-variant">
                            Line Total:
                          </span>
                          <span className="font-geist text-mono-sm text-on-surface font-semibold">
                            {formatMoney(lineTotal)}
                          </span>
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

            {/* One charge for the whole bill, added after tax. Both the
                reason and the amount are printed on the invoice. */}
            <div className="space-y-3">
              <h3 className="text-on-surface text-sm font-semibold">
                Extra charges
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-extra-reason">Reason</Label>
                  <Input
                    id="invoice-extra-reason"
                    placeholder="e.g. Courier / Transport"
                    aria-invalid={Boolean(errors.extraReason)}
                    {...register("extraReason")}
                  />
                  {errors.extraReason ? (
                    <p className="text-body-md text-error" role="alert">
                      {errors.extraReason.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-extra-charges">Charges</Label>
                  <Input
                    id="invoice-extra-charges"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-invalid={Boolean(errors.extraCharges)}
                    {...register("extraCharges")}
                  />
                  {errors.extraCharges ? (
                    <p className="text-body-md text-error" role="alert">
                      {errors.extraCharges.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Totals + actions stay pinned so the grand total is always
                visible without scrolling to the bottom of a long form. */}
            <div className="bg-surface-container-high border-outline-variant sticky bottom-0 -mx-4 -mb-4 border-t px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-4">
              <div className="space-y-1.5">
                <div className="text-body-md text-on-surface-variant flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-geist text-mono-sm tabular-nums">
                    {formatMoney(summary.subTotal)}
                  </span>
                </div>
                {summary.cgst > 0 ? (
                  <div className="text-body-md text-on-surface-variant flex justify-between">
                    <span>CGST</span>
                    <span className="font-geist text-mono-sm tabular-nums">
                      {formatMoney(summary.cgst)}
                    </span>
                  </div>
                ) : null}
                {summary.sgst > 0 ? (
                  <div className="text-body-md text-on-surface-variant flex justify-between">
                    <span>SGST</span>
                    <span className="font-geist text-mono-sm tabular-nums">
                      {formatMoney(summary.sgst)}
                    </span>
                  </div>
                ) : null}
                {summary.igst > 0 ? (
                  <div className="text-body-md text-on-surface-variant flex justify-between">
                    <span>IGST</span>
                    <span className="font-geist text-mono-sm tabular-nums">
                      {formatMoney(summary.igst)}
                    </span>
                  </div>
                ) : null}

                {summary.extra > 0 ? (
                  <div className="text-body-md text-on-surface-variant flex justify-between gap-4">
                    <span className="truncate">
                      {watchedExtraReason?.trim() || "Extra charges"}
                    </span>
                    <span className="font-geist text-mono-sm shrink-0 tabular-nums">
                      {formatMoney(summary.extra)}
                    </span>
                  </div>
                ) : null}

                <div className="bg-outline-variant my-2 h-px" />

                <div className="flex items-baseline justify-between">
                  <span className="text-on-surface text-base font-semibold">
                    Grand Total
                  </span>
                  <span className="text-primary text-xl font-bold tabular-nums">
                    {formatMoney(summary.total)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 sm:h-9"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 flex-1 sm:h-9 sm:flex-none"
                  disabled={isPending}
                >
                  {isPending
                    ? "Saving…"
                    : isEdit
                      ? "Save changes"
                      : "Save invoice"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
