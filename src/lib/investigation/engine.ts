import type {
  CheckStatus,
  DocType,
  DocumentInput,
  Finding,
  InvestigationResult,
  RecommendedAction,
  RiskLevel,
} from "@/lib/types";
import { CHECKS, type CheckTemplate, inr } from "./catalog";
import { Rng, fake } from "./random";

/**
 * The mock investigation engine.
 *
 * No model is called. Findings are drawn from a curated catalog using a PRNG
 * seeded by the investigation id, so each case is unique but reproducible.
 */

const REMEDIATION: Record<string, { title: string; detail: string }> = {
  "VND-01": {
    title: "Re-verify the counterparty before release",
    detail:
      "Request a current incorporation certificate and confirm the registration is active before any further disbursement.",
  },
  "GST-01": {
    title: "Withhold input tax credit on this invoice",
    detail:
      "Do not claim credit until a corrected invoice carrying a valid GSTIN is received from the supplier.",
  },
  "GST-02": {
    title: "Hold the input credit claim for one cycle",
    detail:
      "Track whether the supplier reports the invoice in the next GSTR-1. If it does not appear, reverse the credit before the annual return.",
  },
  "INV-01": {
    title: "Block the payment run for this invoice",
    detail:
      "Confirm against the settled-invoice register. If the earlier payment cleared, reject this submission and notify the vendor.",
  },
  "PO-01": {
    title: "Obtain a written variance approval",
    detail:
      "Route the difference to the budget owner for a change order. Release only the purchase-order value until that approval exists.",
  },
  "PO-02": {
    title: "Reconcile against the goods receipt note",
    detail:
      "Pay only for quantities evidenced by a signed receipt. Raise a debit note for the balance.",
  },
  "PAY-01": {
    title: "Trace the settlement before closing the item",
    detail:
      "Pull the full-period bank statement and locate the transfer. An open payable marked paid is a reconciliation break.",
  },
  "PAY-02": {
    title: "Call the vendor on a previously known number",
    detail:
      "Confirm the account change out-of-band before releasing funds. Do not use contact details printed on this document.",
  },
  "TAX-01": {
    title: "Request a corrected tax invoice",
    detail:
      "The rate applied does not match the declared classification. A revised invoice is needed to protect the credit claim.",
  },
  "TAX-02": {
    title: "Correct the withholding before the quarterly return",
    detail:
      "Deposit the short-deducted amount with interest to avoid a disallowance of the underlying expense.",
  },
  "DOC-01": {
    title: "Obtain a signed copy for the file",
    detail: "Request an executed original so the approval chain is evidenced end to end.",
  },
  "DOC-02": {
    title: "Preserve the file and escalate to forensics",
    detail:
      "Retain the original with its metadata intact. Post-issue alteration of a value field is an integrity event, not a clerical one.",
  },
  "DOC-03": {
    title: "Confirm the accounting period",
    detail: "Re-date or accrue the item so the expense lands in the period it belongs to.",
  },
  "BNK-01": {
    title: "Request the complete statement range",
    detail: "An unbroken balance walk-forward is needed before this statement can support any conclusion.",
  },
  "BNK-02": {
    title: "Escalate the transfer pattern for review",
    detail:
      "Amounts clustered below a reporting threshold need a documented business rationale on file.",
  },
  "SAL-01": {
    title: "Suspend the affected payroll lines",
    detail:
      "Hold the flagged payslips and reconcile each to an active employee record before the next disbursement.",
  },
  "SAL-02": {
    title: "Recompute statutory contributions",
    detail: "Correct the contribution base and file a revised challan for the affected cycle.",
  },
  "VND-02": {
    title: "Escalate to compliance before proceeding",
    detail:
      "A screening hit must be cleared or documented as a false positive by compliance, in writing, before onboarding continues.",
  },
  "VND-03": {
    title: "Open a vendor-independence review",
    detail:
      "Shared banking and directorship across vendors defeats competitive tendering. Review the award history for this cluster.",
  },
  "PRC-01": {
    title: "Benchmark before renewing",
    detail: "Request two comparable quotes and document the rationale if this rate is retained.",
  },
  "APR-01": {
    title: "Route for the missing approval",
    detail: "Obtain the second authorisation required at this value band before payment.",
  },
  "DUP-01": {
    title: "Cross-reference the matching case",
    detail: "Confirm the two submissions are genuinely separate transactions before either is settled.",
  },
};

function eligible(check: CheckTemplate, types: Set<DocType>): boolean {
  if (check.requiresAll && !check.requiresAll.every((t) => types.has(t))) return false;
  if (check.requires && !check.requires.some((t) => types.has(t))) return false;
  return true;
}

function levelFor(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "elevated";
  return "low";
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(n)));

export function runInvestigation(
  seed: string,
  documents: DocumentInput[],
  subject?: string | null,
): InvestigationResult {
  const r = new Rng(seed);
  const types = new Set<DocType>(documents.map((d) => d.docType));

  const pool = CHECKS.filter((c) => eligible(c, types));
  const target = clamp(7 + documents.length * 2 + r.int(0, 2), 8, Math.max(8, pool.length));
  const selected = r.shuffle(pool).slice(0, Math.min(target, pool.length));

  // Keep the catalog's authored order so reports read consistently.
  const ordered = CHECKS.filter((c) => selected.includes(c));

  const findings: Finding[] = ordered.map((check, i) => {
    const status = r.weighted<CheckStatus>(["pass", "warn", "fail"], check.odds);
    const outcome = check.build(r, status);
    return {
      id: `${check.code}-${i}`,
      code: check.code,
      label: check.label,
      category: check.category,
      status,
      detail: outcome.detail,
      evidence: outcome.evidence,
      weight: check.weight,
      source: check.source,
    };
  });

  const passed = findings.filter((f) => f.status === "pass").length;
  const warnings = findings.filter((f) => f.status === "warn").length;
  const failures = findings.filter((f) => f.status === "fail").length;

  const rawRisk = findings.reduce((acc, f) => {
    if (f.status === "fail") return acc + f.weight;
    if (f.status === "warn") return acc + f.weight * 0.42;
    return acc;
  }, 0);
  const maxRisk = findings.reduce((acc, f) => acc + f.weight, 0) || 1;
  const riskScore = clamp((rawRisk / maxRisk) * 128 + r.float(-3, 3), 3, 97);
  const riskLevel = levelFor(riskScore);

  const confidence = clamp(
    89 + documents.length * 1.6 - failures * 3.4 - warnings * 1.1 + r.float(-2.5, 3),
    62,
    99,
  );

  // Exposure scales with the value at stake, not with the number of flags.
  const exposure =
    failures + warnings === 0
      ? 0
      : Math.round(
          ((failures * 3 + warnings) * r.int(180000, 900000)) / 1000,
        ) * 1000;

  const actions = buildActions(findings, riskLevel, r);

  return {
    version: 1,
    seed,
    summary: buildSummary({ subject, findings, passed, warnings, failures, riskLevel, exposure }),
    findings,
    actions,
    confidence,
    riskScore,
    riskLevel,
    metrics: {
      checksRun: findings.length,
      passed,
      warnings,
      failures,
      documentsAnalyzed: documents.length,
      exposure,
      currency: "INR",
      processingMs: r.int(2400, 7200),
    },
    ledger: buildLedger(r, types),
  };
}

function buildActions(
  findings: Finding[],
  riskLevel: RiskLevel,
  r: Rng,
): RecommendedAction[] {
  const flagged = findings
    .filter((f) => f.status !== "pass")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "fail" ? -1 : 1;
      return b.weight - a.weight;
    })
    .slice(0, 4);

  const actions: RecommendedAction[] = flagged.map((f) => {
    const rem = REMEDIATION[f.code];
    return {
      id: `act-${f.id}`,
      title: rem?.title ?? `Review "${f.label}"`,
      detail: rem?.detail ?? f.detail,
      priority: f.status === "fail" ? "immediate" : f.weight >= 7 ? "before-payment" : "routine",
    };
  });

  if (riskLevel === "low" && actions.length === 0) {
    actions.push({
      id: "act-clear",
      title: "Approve for payment",
      detail:
        "No control exceptions were raised. Retain this report with the voucher as evidence of review.",
      priority: "routine",
    });
  }

  actions.push({
    id: "act-file",
    title: "Attach this report to the voucher",
    detail: `Case evidence is retained for ${r.pick([7, 8, 10])} years in line with the record-retention policy.`,
    priority: "routine",
  });

  return actions;
}

function buildSummary(input: {
  subject?: string | null;
  findings: Finding[];
  passed: number;
  warnings: number;
  failures: number;
  riskLevel: RiskLevel;
  exposure: number;
}): string {
  const who = input.subject?.trim() || "the counterparty";
  const { passed, warnings, failures, riskLevel, exposure } = input;

  if (failures === 0 && warnings === 0) {
    return `All ${passed} controls passed for ${who}. Registry, tax and ledger checks reconcile with no exceptions. This case is clear for approval.`;
  }

  const top = input.findings
    .filter((f) => f.status === "fail")
    .sort((a, b) => b.weight - a.weight)[0];

  const lead = top
    ? `The material issue is "${top.label.toLowerCase()}" — ${top.detail.split(".")[0].toLowerCase()}.`
    : `No control failed outright, but ${warnings} check${warnings === 1 ? "" : "s"} need attention before sign-off.`;

  const money = exposure > 0 ? ` Estimated exposure is ${inr(exposure)}.` : "";

  return `${passed} of ${passed + warnings + failures} controls passed for ${who}, with ${failures} failure${failures === 1 ? "" : "s"} and ${warnings} warning${warnings === 1 ? "" : "s"}. ${lead}${money} Overall risk is ${riskLevel}.`;
}

function buildLedger(r: Rng, types: Set<DocType>) {
  const rows: { label: string; value: string; mono?: boolean }[] = [];
  rows.push({ label: "Counterparty GSTIN", value: fake.gstin(r), mono: true });
  rows.push({ label: "Counterparty PAN", value: fake.pan(r), mono: true });
  if (types.has("Invoice")) {
    rows.push({ label: "Invoice number", value: fake.invoiceNo(r), mono: true });
    rows.push({ label: "Invoice date", value: fake.date(r) });
  }
  if (types.has("Purchase Order")) {
    rows.push({ label: "Purchase order", value: fake.poNo(r), mono: true });
  }
  if (types.has("Bank Statement")) {
    rows.push({ label: "Settlement UTR", value: fake.utr(r), mono: true });
  }
  rows.push({
    label: "Document total",
    value: inr(Math.round(r.float(120000, 3200000, 0) / 100) * 100),
  });
  rows.push({ label: "Tax component", value: inr(Math.round(r.float(9000, 460000, 0) / 100) * 100) });
  return rows;
}
