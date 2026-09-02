import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { appName } from "@/config/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { TonalCard } from "@/components/tonal-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) redirect("/");

  const { redirect: redirectParam } = await searchParams;
  const redirectTo =
    typeof redirectParam === "string" &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//")
      ? redirectParam
      : "/";

  return (
    <div className="bg-background relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-30">
        <div className="bg-primary absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
        <div className="bg-primary/70 absolute -right-[5%] -bottom-[5%] h-[30%] w-[30%] rounded-full blur-[100px]" />
      </div>

      <div className="mb-8 flex items-center gap-2">
        <div className="bg-primary/20 text-primary flex size-9 items-center justify-center rounded-lg text-sm font-bold">
          SB
        </div>
        <span className="text-on-surface text-lg font-medium tracking-wide">
          {appName}
        </span>
      </div>

      <TonalCard variant="sunken" padding="xl" className="w-full max-w-md">
        <h1 className="text-on-surface mb-1 text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-on-surface-variant mb-6 text-sm">
          Access your billing dashboard.
        </p>
        <LoginForm redirectTo={redirectTo} />
      </TonalCard>

      <footer className="mt-8 flex items-center justify-center gap-2 opacity-40">
        <ShieldCheck className="text-on-surface-variant size-3.5" />
        <span className="text-on-surface-variant text-xs tracking-[0.1em] uppercase">
          Encrypted Session Protocol
        </span>
      </footer>
    </div>
  );
}
