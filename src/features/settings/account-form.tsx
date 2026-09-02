import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountUpdateSchema } from "@/lib/validations/settings";
import { useUpdateAccount } from "./hooks";
import type { AccountUpdatePayload } from "@/lib/validations/settings";

export function AccountForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AccountUpdatePayload>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: { name: "", image: null },
  });

  const mutation = useUpdateAccount();

  function onSubmit(data: AccountUpdatePayload) {
    mutation.mutate(data, {
      onSuccess: () => reset(data),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-name">Name</Label>
          <Input id="account-name" {...register("name")} />
          {errors.name ? (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-image">Image URL</Label>
          <Input id="account-image" {...register("image")} />
          {errors.image ? (
            <p className="text-destructive text-sm">{errors.image.message}</p>
          ) : null}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save"
        )}
      </Button>
    </form>
  );
}
