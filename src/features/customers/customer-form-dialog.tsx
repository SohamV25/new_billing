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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "@/features/customers/hooks";
import type { CustomerDetail } from "@/features/customers/types";

const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(200, "Customer name must be 200 characters or fewer"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal(""))
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number")
    .or(z.literal(""))
    .optional(),
  address: z
    .string()
    .trim()
    .max(500, "Address must be 500 characters or fewer")
    .optional(),
  city: z
    .string()
    .trim()
    .max(100, "City must be 100 characters or fewer")
    .optional(),
  state: z
    .string()
    .trim()
    .max(100, "State must be 100 characters or fewer")
    .optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "Pincode must be 6 digits")
    .or(z.literal(""))
    .optional(),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstinPattern, "Enter a valid GSTIN")
    .or(z.literal(""))
    .optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

type CustomerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerDetail | null;
};

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: CustomerFormDialogProps) {
  const isEdit = customer !== null;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isPending = createCustomer.isPending || updateCustomer.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      customer
        ? {
            name: customer.name,
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            state: customer.state ?? "",
            pincode: customer.pincode ?? "",
            gstin: customer.gstin ?? "",
          }
        : {
            name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            gstin: "",
          }
    );
  }, [open, customer, reset]);

  async function onSubmit(values: CustomerFormValues) {
    const input = {
      name: values.name,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      address: values.address?.trim() || null,
      city: values.city?.trim() || null,
      state: values.state?.trim() || null,
      pincode: values.pincode?.trim() || null,
      gstin: values.gstin?.trim() || null,
    };

    if (customer) {
      await updateCustomer.mutateAsync({ id: customer.id, input });
    } else {
      await createCustomer.mutateAsync(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the customer details."
              : "Add a customer to track them across invoices and quotations."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Customer name</Label>
            <Input
              id="customer-name"
              placeholder="e.g. Shree Electricals"
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
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="billing@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="+91 98765 43210"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-address">Address</Label>
            <Textarea
              id="customer-address"
              rows={3}
              placeholder="Street, area, landmark"
              aria-invalid={Boolean(errors.address)}
              {...register("address")}
            />
            {errors.address ? (
              <p className="text-body-md text-error" role="alert">
                {errors.address.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-city">City</Label>
              <Input
                id="customer-city"
                placeholder="e.g. Mumbai"
                autoComplete="address-level2"
                aria-invalid={Boolean(errors.city)}
                {...register("city")}
              />
              {errors.city ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.city.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-state">State</Label>
              <Input
                id="customer-state"
                placeholder="e.g. Maharashtra"
                autoComplete="address-level1"
                aria-invalid={Boolean(errors.state)}
                {...register("state")}
              />
              {errors.state ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.state.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-pincode">Pincode</Label>
              <Input
                id="customer-pincode"
                inputMode="numeric"
                placeholder="e.g. 400001"
                autoComplete="postal-code"
                aria-invalid={Boolean(errors.pincode)}
                {...register("pincode")}
              />
              {errors.pincode ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.pincode.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-gstin">GSTIN</Label>
              <Input
                id="customer-gstin"
                placeholder="e.g. 27AAACS1234F1Z5"
                aria-invalid={Boolean(errors.gstin)}
                {...register("gstin")}
              />
              {errors.gstin ? (
                <p className="text-body-md text-error" role="alert">
                  {errors.gstin.message}
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
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
