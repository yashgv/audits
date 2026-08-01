import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Aurora } from "@/components/marketing/aurora";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Aurora />

      <header className="relative z-10">
        <div className="container flex h-20 items-center justify-between">
          <Wordmark />
          <Button asChild variant="ghost" size="sm">
            <Link href={user ? "/dashboard" : "/login"}>
              {user ? "Open workspace" : "Sign in"}
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative z-10 container pb-28 pt-10 text-center sm:pt-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-pass" />
            22 controls across GST, ledger and document forensics
          </span>
        </div>

        <h1 className="mx-auto mt-8 max-w-[16ch] text-balance text-[clamp(2.75rem,8vw,5.5rem)] font-semibold leading-[0.95] tracking-tighter text-gradient animate-fade-up [animation-delay:80ms]">
          Investigate financial documents in seconds.
        </h1>

        <p className="mx-auto mt-7 max-w-[58ch] text-pretty text-[17px] leading-relaxed text-muted-foreground animate-fade-up [animation-delay:160ms]">
          Drop in an invoice, a GST return, a purchase order or a bank statement. Veritas
          reconciles them against each other and returns exactly what does not add up —
          with the evidence, a risk score and the action to take.
        </p>

        <div className="mt-10 flex items-center justify-center animate-fade-up [animation-delay:240ms]">
          <Button asChild size="lg" className="group">
            <Link href={user ? "/investigations/new" : "/login"}>
              Start an investigation
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-20 animate-fade-up [animation-delay:320ms]">
          <HeroVisual />
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60">
        <div className="container flex h-16 items-center justify-between text-[12.5px] text-muted-foreground">
          <span>Veritas — compliance investigation workspace</span>
          <span>Demo build · findings are simulated</span>
        </div>
      </footer>
    </main>
  );
}
