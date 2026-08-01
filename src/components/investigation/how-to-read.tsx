import { Badge } from "@/components/ui/badge";

const BANDS = [
  { range: "0–24", label: "Low", tone: "pass" as const, meaning: "Nothing failed. Approve and file the report." },
  { range: "25–49", label: "Elevated", tone: "warn" as const, meaning: "Minor gaps. Confirm them, then approve." },
  { range: "50–74", label: "High", tone: "warn" as const, meaning: "Something material is wrong. Hold the payment." },
  { range: "75–100", label: "Critical", tone: "fail" as const, meaning: "Do not pay. Escalate to compliance." },
];

const OUTCOMES = [
  { tone: "pass" as const, label: "Pass", meaning: "The control was checked and it reconciled." },
  { tone: "warn" as const, label: "Warning", meaning: "Not wrong, but unexplained. Someone should confirm it." },
  { tone: "fail" as const, label: "Failed", meaning: "The control did not hold. This is the reason to stop." },
];

/** Sits under the findings so the numbers above are not left to interpretation. */
export function HowToRead() {
  return (
    <section className="glass p-6">
      <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
        How to read this
      </h2>

      <div className="mt-5 grid gap-7 sm:grid-cols-2">
        <div>
          <h3 className="text-[14px] font-medium tracking-tight">Fraud risk</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            One number, 0 to 100. Each failed control adds its full weight, each warning
            adds about half. A single high-weight failure — a changed payee account, a
            duplicate invoice — is enough to push a case into the red on its own.
          </p>
          <ul className="mt-4 space-y-2">
            {BANDS.map((b) => (
              <li key={b.range} className="flex items-start gap-3">
                <Badge tone={b.tone} className="mt-0.5 shrink-0 tabular-nums">
                  {b.range}
                </Badge>
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                  <span className="text-foreground/90">{b.label}</span> — {b.meaning}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[14px] font-medium tracking-tight">Each finding</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Open any finding to see the evidence line — the actual values that were
            compared — plus what it was checked against and how heavily it counts.
          </p>
          <ul className="mt-4 space-y-2">
            {OUTCOMES.map((o) => (
              <li key={o.label} className="flex items-start gap-3">
                <Badge tone={o.tone} className="mt-0.5 shrink-0">
                  {o.label}
                </Badge>
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {o.meaning}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-[14px] font-medium tracking-tight">Confidence</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            How much of the document set resolved cleanly. It rises with more supporting
            documents and falls when fields cannot be matched. Low confidence does not
            mean low risk — it means the risk number itself is less certain.
          </p>
        </div>
      </div>
    </section>
  );
}
