"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema } from "@/lib/validations/settings";
import { useChangePassword } from "./hooks";
import type { ChangePasswordPayload } from "@/lib/validations/settings";

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordPayload>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const mutation = useChangePassword();

  function onSubmit(data: ChangePasswordPayload) {
    mutation.mutate(data, {
      onSuccess: () => reset(),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          {...register("currentPassword")}
        />
        {errors.currentPassword ? (
          <p className="text-destructive text-sm">
            {errors.currentPassword.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input id="new-password" type="password" {...register("newPassword")} />
        {errors.newPassword ? (
          <p className="text-destructive text-sm">
            {errors.newPassword.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Changing…
          </>
        ) : (
          "Change password"
        )}
      </Button>
    </form>
  );
}
