"use client";

import { motion } from "framer-motion";
import { Check, FileText, ShieldAlert, TriangleAlert } from "lucide-react";

const LINES = [92, 74, 100, 58, 86, 44, 96, 68, 80, 52];

const CALLOUTS = [
  {
    icon: Check,
    tone: "text-pass",
    ring: "border-pass/30 bg-pass/[0.08]",
    title: "GSTIN verified",
    sub: "27AAFCV2449M1ZK · active",
    delay: 0.9,
    y: 18,
  },
  {
    icon: TriangleAlert,
    tone: "text-warn",
    ring: "border-warn/30 bg-warn/[0.08]",
    title: "Amount differs from PO",
    sub: "₹8,42,000 vs ₹7,90,000 · +6.6%",
    delay: 1.35,
    y: 108,
  },
  {
    icon: ShieldAlert,
    tone: "text-fail",
    ring: "border-fail/30 bg-fail/[0.08]",
    title: "Payee account changed",
    sub: "4 days before invoice date",
    delay: 1.8,
    y: 198,
  },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[880px]">
      {/* Reflection glow under the assembly */}
      <div className="absolute inset-x-16 bottom-0 h-40 rounded-[50%] bg-primary/20 blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="glass noise relative grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
        style={{ perspective: 1200 }}
      >
        {/* ---- Document being scanned ---- */}
        <div className="relative overflow-hidden rounded-md border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <FileText className="size-4 text-primary" />
            <span className="truncate text-[13px] font-medium">invoice_TX-2645.pdf</span>
          </div>

          <div className="mt-4 space-y-2.5">
            {LINES.map((w, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.35 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                className="h-2 origin-left rounded-full bg-white/[0.09]"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>

          {/* Scanline */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-24"
            initial={{ top: "-20%" }}
            animate={{ top: ["-20%", "100%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 0.8 }}
          >
            <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
            <div className="h-px w-full bg-primary/70 shadow-[0_0_18px_2px_hsl(var(--primary)/0.6)]" />
          </motion.div>
        </div>

        {/* ---- Findings streaming out ---- */}
        <div className="relative min-h-[280px]">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-primary" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Live findings
            </span>
          </div>

          <div className="space-y-3">
            {CALLOUTS.map((c) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, x: -16, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: c.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-start gap-3 rounded-md border ${c.ring} p-3.5`}
              >
                <c.icon className={`mt-0.5 size-4 shrink-0 ${c.tone}`} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium leading-tight">{c.title}</p>
                  <p className="mt-1 truncate font-mono text-[11.5px] text-muted-foreground">
                    {c.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.25, duration: 0.6 }}
            className="mt-4 flex items-center justify-between rounded-md border border-white/[0.07] bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Recommended
              </p>
              <p className="mt-0.5 text-[13.5px] font-medium">Hold payment · verify payee</p>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-semibold leading-none tracking-tighter text-fail tabular-nums">
                78
              </p>
              <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                risk
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
