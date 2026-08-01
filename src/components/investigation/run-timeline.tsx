"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PHASES } from "@/lib/investigation/phases";
import { executeInvestigationAction } from "@/app/actions/investigations";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/types";

const PHASE_MS = 780;

export function RunTimeline({
  id,
  documents,
}: {
  id: string;
  documents: DocumentRecord[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const settled = useRef(false);
  const animationDone = useRef(false);
  const started = useRef(false);

  // Advance the visible phases on a fixed cadence.
  useEffect(() => {
    const timers = PHASES.map((_, i) =>
      setTimeout(() => setPhase(i + 1), PHASE_MS * (i + 1)),
    );
    const done = setTimeout(() => {
      animationDone.current = true;
      if (settled.current) router.refresh();
    }, PHASE_MS * PHASES.length + 260);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [router]);

  // Kick off the real work immediately; the animation only paces the reveal.
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    (async () => {
      const result = await executeInvestigationAction(id);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      settled.current = true;
      if (animationDone.current) router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const progress = Math.min(100, (phase / PHASES.length) * 100);

  return (
    <div className="mx-auto max-w-[680px] py-6">
      <div className="glass noise overflow-hidden p-8">
        {/* Scanning header */}
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-primary" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <h2 className="text-[15px] font-medium tracking-tight">
            {error ? "Analysis interrupted" : "Investigation in progress"}
          </h2>
          <span className="ml-auto font-mono text-[12px] tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress rail */}
        <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(200_90%_62%)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Phases */}
        <ol className="mt-7 space-y-1">
          {PHASES.map((p, i) => {
            const state = i < phase ? "done" : i === phase ? "active" : "waiting";
            return (
              <li
                key={p.key}
                className={cn(
                  "relative flex items-start gap-3.5 rounded-md px-3 py-3 transition-colors duration-500",
                  state === "active" && "bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-500",
                    state === "done" && "border-pass/40 bg-pass/15 text-pass",
                    state === "active" && "border-primary/50 bg-primary/15 text-primary",
                    state === "waiting" && "border-white/[0.09] text-muted-foreground",
                  )}
                >
                  {state === "done" ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </motion.span>
                  ) : state === "active" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current opacity-40" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13.5px] transition-colors duration-500",
                      state === "waiting" ? "text-muted-foreground/60" : "text-foreground",
                    )}
                  >
                    {p.label}
                  </p>
                  <AnimatePresence>
                    {state !== "waiting" ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-0.5 font-mono text-[11.5px] text-muted-foreground"
                      >
                        {p.hint}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Documents in scope */}
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            In scope
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {documents.map((d, i) => (
              <motion.span
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="truncate rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {d.name}
              </motion.span>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-md border border-fail/25 bg-fail/[0.08] p-4">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-fail" />
            <div className="flex-1">
              <p className="text-[13.5px] text-fail">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
