import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Aurora } from "@/components/marketing/aurora";
import { Wordmark } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { authEnabled, hasSupabase } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  // Sign-in is off — there is nothing to log into.
  if (!authEnabled) redirect("/dashboard");
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <Aurora />

      <div className="relative z-10 container flex h-20 items-center justify-between">
        <Wordmark />
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="mb-8 text-center">
            <h1 className="text-[32px] font-semibold leading-tight tracking-tighter">
              Open your workspace
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Cases, evidence and reports stay scoped to your account.
            </p>
          </div>

          <div className="glass noise p-7">
            <LoginForm liveAuth={hasSupabase} />
          </div>
        </div>
      </div>
    </main>
  );
}
