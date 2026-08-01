"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { credentialsSchema, type CredentialsInput } from "@/lib/validations";
import { authenticate } from "./actions";

export function LoginForm({ liveAuth }: { liveAuth: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await authenticate(values, mode);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(mode === "signup" ? "Workspace created" : "Welcome back");
      router.replace("/dashboard");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="••••••••"
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            {mode === "signup" ? "Create workspace" : "Continue"}
            <ArrowRight />
          </>
        )}
      </Button>

      <div className="flex items-center justify-between pt-1 text-[13px]">
        <button
          type="button"
          className="text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Create an account" : "I already have an account"}
        </button>

        {!liveAuth ? (
          <button
            type="button"
            className="text-primary transition-opacity hover:opacity-80"
            onClick={() => {
              setValue("email", "analyst@veritas.dev", { shouldValidate: true });
              setValue("password", "veritas2026", { shouldValidate: true });
            }}
          >
            Use demo credentials
          </button>
        ) : null}
      </div>

      {!liveAuth ? (
        <p className="flex items-start gap-2 rounded-md border border-white/[0.07] bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Running without a Supabase project, so any email and password opens a local
            workspace scoped to this browser. Add your Supabase keys to{" "}
            <code className="font-mono text-foreground/80">.env</code> to switch on real
            authentication — no code changes needed.
          </span>
        </p>
      ) : null}
    </form>
  );
}
