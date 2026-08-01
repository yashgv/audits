"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, TriangleAlert, X } from "lucide-react";
import { STATUS_META } from "@/lib/risk";
import { cn } from "@/lib/utils";
import type { CheckStatus, Finding } from "@/lib/types";

type Filter = "all" | CheckStatus;

const ICON: Record<CheckStatus, typeof Check> = {
  pass: Check,
  warn: TriangleAlert,
  fail: X,
};

const RING: Record<CheckStatus, string> = {
  pass: "border-pass/30 bg-pass/10 text-pass",
  warn: "border-warn/30 bg-warn/10 text-warn",
  fail: "border-fail/30 bg-fail/10 text-fail",
};

export function FindingsPanel({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(
    findings.find((f) => f.status === "fail")?.id ?? null,
  );

  const counts = useMemo(
    () => ({
      all: findings.length,
      fail: findings.filter((f) => f.status === "fail").length,
      warn: findings.filter((f) => f.status === "warn").length,
      pass: findings.filter((f) => f.status === "pass").length,
    }),
    [findings],
  );

  // Exceptions first — nobody scrolls past twelve green ticks to find the red one.
  const ordered = useMemo(() => {
    const rank: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 };
    return [...findings].sort((a, b) => rank[a.status] - rank[b.status] || b.weight - a.weight);
  }, [findings]);

  const visible = filter === "all" ? ordered : ordered.filter((f) => f.status === filter);

  const TABS: { key: Filter; label: string }[] = [
    { key: "all", label: `All ${counts.all}` },
    { key: "fail", label: `Failed ${counts.fail}` },
    { key: "warn", label: `Warnings ${counts.warn}` },
    { key: "pass", label: `Passed ${counts.pass}` },
  ];

  return (
    <div className="glass overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-4">
        <h2 className="mr-auto text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
          Findings
        </h2>
        <div className="no-print flex gap-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "relative rounded-md px-2.5 py-1 text-[12px] transition-colors",
                filter === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === tab.key ? (
                <motion.span
                  layoutId="finding-tab"
                  className="absolute inset-0 rounded-md bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13.5px] text-muted-foreground">
            Nothing in this category.
          </p>
        ) : null}

        {visible.map((f) => {
          const Icon = ICON[f.status];
          const isOpen = open === f.id;
          return (
            <div key={f.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-white/[0.025]"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                    RING[f.status],
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2.6} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-[14px] font-medium tracking-tight">{f.label}</span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      {f.code} · {f.category}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[13px] leading-relaxed text-muted-foreground",
                      !isOpen && "line-clamp-1",
                    )}
                  >
                    {f.detail}
                  </p>
                </div>

                <ChevronDown
                  className={cn(
                    "no-print mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mx-5 mb-4 grid gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-3">
                      <Meta label="Evidence" value={f.evidence} mono />
                      <Meta label="Checked against" value={f.source} />
                      <Meta
                        label="Outcome"
                        value={`${STATUS_META[f.status].label} · weight ${f.weight}/10`}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-[12.5px] text-foreground/90", mono && "font-mono")}>{value}</p>
    </div>
  );
}
