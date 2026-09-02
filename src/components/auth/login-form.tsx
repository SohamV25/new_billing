"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setErrorMessage(null);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setErrorMessage(error.message ?? "Unable to sign in. Please try again.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-on-surface-variant">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="border-outline-variant bg-surface-container text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-primary/20 h-10 rounded-lg px-3"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-error text-sm" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-on-surface-variant">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="border-outline-variant bg-surface-container text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-primary/20 h-10 rounded-lg px-3"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-error text-sm" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="border-error/20 bg-error/10 text-error flex items-start gap-2 rounded-lg border px-3 py-2"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-11 w-full"
      >
        {isSubmitting ? (
          "Signing in…"
        ) : (
          <>
            <LogIn />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
}
