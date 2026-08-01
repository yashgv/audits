import type { CheckStatus, RiskLevel } from "@/lib/types";

/** Shared by server and client — keep this module free of "use client". */
export const RISK_META: Record<
  RiskLevel,
  { label: string; short: string; color: string; tone: string; blurb: string }
> = {
  low: {
    label: "Low risk",
    short: "Low",
    color: "hsl(152 62% 50%)",
    tone: "text-pass",
    blurb: "Controls reconcile. Safe to approve.",
  },
  elevated: {
    label: "Elevated risk",
    short: "Elevated",
    color: "hsl(38 94% 58%)",
    tone: "text-warn",
    blurb: "Minor exceptions. Confirm before sign-off.",
  },
  high: {
    label: "High risk",
    short: "High",
    color: "hsl(25 94% 60%)",
    tone: "text-warn",
    blurb: "Material exceptions. Hold the payment.",
  },
  critical: {
    label: "Critical risk",
    short: "Critical",
    color: "hsl(0 78% 63%)",
    tone: "text-fail",
    blurb: "Do not disburse. Escalate immediately.",
  },
};

export const riskTone = (level: RiskLevel): "pass" | "warn" | "fail" =>
  level === "low" ? "pass" : level === "critical" ? "fail" : "warn";

export const STATUS_META: Record<
  CheckStatus,
  { label: string; tone: "pass" | "warn" | "fail"; glyph: string }
> = {
  pass: { label: "Pass", tone: "pass", glyph: "✓" },
  warn: { label: "Warning", tone: "warn", glyph: "!" },
  fail: { label: "Failed", tone: "fail", glyph: "×" },
};
