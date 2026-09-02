"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateProduct, useUpdateProduct } from "@/features/products/hooks";
import type { ProductListItem } from "@/features/products/types";

const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name must be 200 characters or fewer"),
  hsn: z
    .string()
    .trim()
    .max(100, "HSN must be 100 characters or fewer")
    .optional(),
  unit: z
    .string()
    .trim()
    .max(20, "Unit must be 20 characters or fewer")
    .optional(),
  price: z
    .number()
    .finite("Enter a valid price")
    .min(0, "Price cannot be negative")
    .max(999_999_999.99, "Price is too large"),
  gstRate: z
    .number()
    .finite("Enter a valid GST rate")
    .min(0, "GST rate cannot be negative")
    .max(100, "GST rate cannot exceed 100"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductListItem | null;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const isEdit = product !== null;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      hsn: "",
      unit: "",
      price: 0,
      gstRate: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      product
        ? {
            name: product.name,
            hsn: product.hsn ?? "",
            unit: product.unit ?? "",
            price: Number(product.price),
            gstRate: Number(product.gstRate),
          }
        : {
            name: "",
            hsn: "",
            unit: "",
            price: 0,
            gstRate: 0,
          }
    );
  }, [open, product, reset]);

  async function onSubmit(values: ProductFormValues) {
    const optional = {
      hsn: values.hsn?.trim() || undefined,
      unit: values.unit?.trim() || undefined,
    };

    if (product) {
      await updateProduct.mutateAsync({
        id: product.id,
        input: {
          name: values.name,
          ...optional,
          price: values.price,
          gstRate: values.gstRate,
        },
      });
    } else {
      await createProduct.mutateAsync({
        name: values.name,
        ...optional,
        price: values.price,
        gstRate: values.gstRate,
        initialStock: 0,
        lowStockAt: 5,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the product details. Stock is managed separately."
              : "Create a product. Stock is managed from the Inventory page."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              placeholder="e.g. 2.5mm Copper Wire (100m)"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-body-md text-error" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-hsn">HSN</Label>
              <Input
                id="product-hsn"
                placeholder="e.g. 8544"
                aria-invalid={Boolean(errors.hsn)}
                {...register("hsn")}
              />
              {errors.hsn ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.hsn.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-unit">Unit</Label>
              <Input
                id="product-unit"
                placeholder="e.g. pcs, m"
                aria-invalid={Boolean(errors.unit)}
                {...register("unit")}
              />
              {errors.unit ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.unit.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-price">Selling price</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                aria-invalid={Boolean(errors.price)}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.price.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-gst">GST rate (%)</Label>
              <Input
                id="product-gst"
                type="number"
                min="0"
                max="100"
                step="0.25"
                placeholder="e.g. 18"
                aria-invalid={Boolean(errors.gstRate)}
                {...register("gstRate", { valueAsNumber: true })}
              />
              {errors.gstRate ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.gstRate.message}
                </p>
              ) : null}
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
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
