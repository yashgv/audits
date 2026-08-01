import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Aurora } from "@/components/marketing/aurora";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { HowItWorks, HonestyPanel } from "@/components/marketing/explainer";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Aurora />

      <header className="relative z-10">
        <div className="container flex h-20 items-center justify-between">
          <Wordmark />
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Open workspace</Link>
          </Button>
        </div>
      </header>

      <section className="relative z-10 container pb-24 pt-10 text-center sm:pt-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-pass" />
            No sign-up — open it and start
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

        <div className="mt-10 flex flex-col items-center gap-3 animate-fade-up [animation-delay:240ms]">
          <Button asChild size="lg" className="group">
            <Link href="/investigations/new">
              Start an investigation
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Link
            href="/dashboard"
            className="text-[13.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            or look at three finished cases first
          </Link>
        </div>

        <div className="mt-20 animate-fade-up [animation-delay:320ms]">
          <HeroVisual />
        </div>
      </section>

      <HowItWorks />
      <HonestyPanel />

      <footer className="relative z-10 border-t border-border/60">
        <div className="container flex h-16 items-center justify-between text-[12.5px] text-muted-foreground">
          <span>Veritas — compliance investigation workspace</span>
          <span>Demo build · findings are simulated</span>
        </div>
      </footer>
    </main>
  );
}
