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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/validations/payment";
import { useAddPayment, useUpdatePayment } from "@/features/invoices/hooks";
import type { PaymentDetail, PaymentMethod } from "@/features/invoices/types";

const paymentFormSchema = z.object({
  amount: z
    .string()
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  method: z.enum(PAYMENT_METHODS),
  reference: z
    .string()
    .max(100, "Reference must be 100 characters or fewer")
    .optional(),
  note: z.string().max(300, "Note must be 300 characters or fewer").optional(),
  paidAt: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
};

function emptyValues(): PaymentFormValues {
  return {
    amount: "",
    method: "CASH",
    reference: "",
    note: "",
    paidAt: "",
  };
}

function toDateInput(value: Date): string {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function toValues(payment: PaymentDetail): PaymentFormValues {
  return {
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference ?? "",
    note: payment.note ?? "",
    paidAt: toDateInput(new Date(payment.paidAt)),
  };
}

type PaymentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  outstanding: string;
  payment?: PaymentDetail | null;
};

export function PaymentFormDialog({
  open,
  onOpenChange,
  invoiceId,
  outstanding,
  payment,
}: PaymentFormDialogProps) {
  const addPayment = useAddPayment();
  const updatePayment = useUpdatePayment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: emptyValues(),
  });

  // The parent controls `open`, so Radix never calls onOpenChange on the way in
  // — reset here instead, otherwise the prefilled values never land.
  useEffect(() => {
    if (!open) return;
    reset(
      payment
        ? toValues(payment)
        : {
            ...emptyValues(),
            // Vendors almost always settle in full, so offer the whole
            // outstanding balance and today's date.
            amount: String(Number(outstanding) || ""),
            paidAt: toDateInput(new Date()),
          }
    );
  }, [open, payment, outstanding, reset]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function buildInput(values: PaymentFormValues) {
    return {
      amount: Number(values.amount),
      method: values.method,
      reference: values.reference?.trim() || undefined,
      note: values.note?.trim() || undefined,
      paidAt: values.paidAt ? new Date(`${values.paidAt}T00:00:00`) : undefined,
    };
  }

  async function onSubmit(values: PaymentFormValues) {
    if (payment) {
      await updatePayment.mutateAsync({
        id: invoiceId,
        paymentId: payment.id,
        input: buildInput(values),
      });
    } else {
      await addPayment.mutateAsync({
        id: invoiceId,
        input: buildInput(values),
      });
    }
    onOpenChange(false);
  }

  const isPending = addPayment.isPending || updatePayment.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {payment ? "Edit payment" : "Record payment"}
          </DialogTitle>
          <DialogDescription>
            Outstanding balance: {formatMoney(outstanding)}. The invoice status
            is updated automatically.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={Boolean(errors.amount)}
                {...register("amount")}
              />
              {errors.amount ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.amount.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-method">Method</Label>
              <Select
                value={watch("method")}
                onValueChange={(value) =>
                  setValue("method", value as PaymentMethod)
                }
              >
                <SelectTrigger id="payment-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">Payment date</Label>
              <Input
                id="payment-date"
                type="date"
                aria-invalid={Boolean(errors.paidAt)}
                {...register("paidAt")}
              />
              {errors.paidAt ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.paidAt.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-reference">Reference</Label>
              <Input
                id="payment-reference"
                placeholder="Transaction ID, cheque no…"
                aria-invalid={Boolean(errors.reference)}
                {...register("reference")}
              />
              {errors.reference ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.reference.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">Note</Label>
            <Textarea
              id="payment-note"
              rows={2}
              placeholder="Optional note…"
              {...register("note")}
            />
            {errors.note ? (
              <p className="text-body-md text-error" role="alert">
                {errors.note.message}
              </p>
            ) : null}
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
                : payment
                  ? "Save changes"
                  : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
