"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdjustStock } from "@/features/products/hooks";

export type StockTarget = {
  id: string;
  name: string;
  inventory: { quantity: number; lowStockAt: number } | null;
};

const MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT"] as const;

const stockFormSchema = z
  .object({
    type: z.enum(MOVEMENT_TYPES),
    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .min(0, "Quantity cannot be negative"),
    lowStockAt: z
      .number()
      .int("Low stock threshold must be a whole number")
      .min(0, "Low stock threshold cannot be negative"),
    reason: z
      .string()
      .trim()
      .max(300, "Reason must be 300 characters or fewer")
      .optional(),
  })
  .refine((value) => value.type === "ADJUSTMENT" || value.quantity >= 1, {
    path: ["quantity"],
    message: "Quantity must be at least 1",
  });

type StockFormValues = z.infer<typeof stockFormSchema>;

function computeNewQuantity(
  current: number,
  type: StockFormValues["type"],
  quantity: number
): number {
  if (type === "IN") return current + quantity;
  if (type === "OUT") return current - quantity;
  return quantity;
}

type ProductStockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: StockTarget | null;
};

export function ProductStockDialog({
  open,
  onOpenChange,
  product,
}: ProductStockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {product ? (
        <StockFormContent
          key={product.id}
          product={product}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function StockFormContent({
  product,
  onClose,
}: {
  product: StockTarget;
  onClose: () => void;
}) {
  const adjustStock = useAdjustStock();
  const currentStock = product.inventory?.quantity ?? 0;
  const [movementType, setMovementType] =
    useState<StockFormValues["type"]>("IN");
  const [quantityValue, setQuantityValue] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      type: "IN",
      quantity: 1,
      lowStockAt: product.inventory?.lowStockAt ?? 5,
      reason: "",
    },
  });

  const newQuantity = computeNewQuantity(
    currentStock,
    movementType,
    quantityValue
  );
  const goesNegative = newQuantity < 0;
  const isPending = adjustStock.isPending;

  async function onSubmit(values: StockFormValues) {
    await adjustStock.mutateAsync({
      id: product.id,
      input: {
        type: values.type,
        quantity: values.quantity,
        lowStockAt: values.lowStockAt,
        reason: values.reason?.trim() || undefined,
      },
    });
    onClose();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription>
          {product.name} — current stock is{" "}
          <span className="font-geist text-mono-sm text-foreground font-medium">
            {currentStock}
          </span>
          .
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="stock-type">Movement type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setMovementType(value as StockFormValues["type"]);
                }}
              >
                <SelectTrigger id="stock-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock in (received)</SelectItem>
                  <SelectItem value="OUT">Stock out (sold/used)</SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    Set absolute quantity
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock-quantity">Quantity</Label>
          <Input
            id="stock-quantity"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            aria-invalid={Boolean(errors.quantity) || goesNegative}
            {...register("quantity", {
              valueAsNumber: true,
              onChange: (event) =>
                setQuantityValue(Number(event.target.value) || 0),
            })}
          />
          {errors.quantity ? (
            <p className="text-body-md text-error" role="alert">
              {errors.quantity.message}
            </p>
          ) : null}
          {!errors.quantity && goesNegative ? (
            <p className="text-body-md text-error" role="alert">
              This would take stock to {newQuantity}, which is not allowed.
            </p>
          ) : null}
          {!errors.quantity && !goesNegative ? (
            <p className="text-body-md text-on-surface-variant">
              New stock level:{" "}
              <span className="font-geist text-mono-sm text-foreground font-medium">
                {newQuantity}
              </span>
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock-lowstock">Low-stock alert at</Label>
          <Input
            id="stock-lowstock"
            type="number"
            min="0"
            step="1"
            aria-invalid={Boolean(errors.lowStockAt)}
            {...register("lowStockAt", { valueAsNumber: true })}
          />
          {errors.lowStockAt ? (
            <p className="text-body-md text-error" role="alert">
              {errors.lowStockAt.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock-reason">Reason</Label>
          <Input
            id="stock-reason"
            placeholder="e.g. Purchase order #123"
            aria-invalid={Boolean(errors.reason)}
            {...register("reason")}
          />
          {errors.reason ? (
            <p className="text-body-md text-error" role="alert">
              {errors.reason.message}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || goesNegative}>
            {isPending ? "Updating…" : "Update stock"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
