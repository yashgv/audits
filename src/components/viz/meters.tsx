"use client";

import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import { RISK_META } from "@/lib/risk";
import type { RiskLevel } from "@/lib/types";

/* ------------------------------------------------------------------ */

const R = 84;
const CIRC = Math.PI * R; // half circle
const SWEEP = 180;

export function RiskDial({
  score,
  level,
  className,
}: {
  score: number;
  level: RiskLevel;
  className?: string;
}) {
  const animated = useCountUp(score, 1400, 200);
  const meta = RISK_META[level];
  const pct = Math.min(1, Math.max(0, animated / 100));

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <svg width="212" height="126" viewBox="-6 -6 212 118" className="overflow-visible">
          <defs>
            <linearGradient id="risk-track" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--pass))" />
              <stop offset="45%" stopColor="hsl(var(--warn))" />
              <stop offset="100%" stopColor="hsl(var(--fail))" />
            </linearGradient>
            <filter id="risk-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={`M 16 100 A ${R} ${R} 0 0 1 184 100`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Gradient reference arc, dimmed */}
          <path
            d={`M 16 100 A ${R} ${R} 0 0 1 184 100`}
            fill="none"
            stroke="url(#risk-track)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.14"
          />
          {/* Value arc */}
          <path
            d={`M 16 100 A ${R} ${R} 0 0 1 184 100`}
            fill="none"
            stroke="url(#risk-track)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            filter="url(#risk-glow)"
          />

          {/* Tick marks every 25 */}
          {[0, 25, 50, 75, 100].map((t) => {
            const a = (Math.PI * (180 - (t / 100) * SWEEP)) / 180;
            const x = 100 + Math.cos(a) * (R + 13);
            const y = 100 - Math.sin(a) * (R + 13);
            return (
              <text
                key={t}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[9px] font-medium"
              >
                {t}
              </text>
            );
          })}

          {/* Needle head */}
          <motion.circle
            r="6"
            fill={meta.color}
            stroke="hsl(var(--background))"
            strokeWidth="3"
            initial={false}
            animate={{
              cx: 100 + Math.cos((Math.PI * (180 - pct * SWEEP)) / 180) * R,
              cy: 100 - Math.sin((Math.PI * (180 - pct * SWEEP)) / 180) * R,
            }}
            transition={{ type: "spring", stiffness: 60, damping: 18 }}
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span
            className="text-[46px] font-semibold leading-none tracking-tighter tabular-nums"
            style={{ color: meta.color }}
          >
            {Math.round(animated)}
          </span>
          <span className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            Fraud risk
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className={cn("text-sm font-medium", meta.tone)}>{meta.label}</p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{meta.blurb}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ConfidenceMeter({ value }: { value: number }) {
  const animated = useCountUp(value, 1200, 350);
  const segments = 24;
  const lit = Math.round((animated / 100) * segments);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Confidence
        </span>
        <span className="text-lg font-semibold tabular-nums tracking-tight">
          {Math.round(animated)}
          <span className="text-sm text-muted-foreground">%</span>
        </span>
      </div>
      <div className="mt-2.5 flex gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-6 flex-1 rounded-[2px] transition-colors duration-300",
              i < lit ? "bg-primary" : "bg-white/[0.06]",
            )}
            style={i < lit ? { opacity: 0.45 + (i / segments) * 0.55 } : undefined}
          />
        ))}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
        {value >= 90
          ? "Every field was extracted cleanly and cross-referenced against a source of record."
          : value >= 75
            ? "Most fields resolved cleanly. A small number were inferred from context."
            : "Several fields were unreadable or unmatched. Treat the findings as directional."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass glass-hover group p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-[28px] font-semibold leading-none tracking-tighter tabular-nums",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
