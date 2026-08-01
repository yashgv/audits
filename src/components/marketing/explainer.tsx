import {
  Ban,
  CircleCheck,
  FileStack,
  Gauge,
  ScanLine,
  ShieldQuestion,
} from "lucide-react";

const STEPS = [
  {
    icon: FileStack,
    step: "First",
    title: "Add the documents",
    body: "Drag in everything that belongs to one transaction — the invoice, the purchase order it was raised against, the bank statement that should show the payment. Veritas reads the file names to work out what each one is.",
  },
  {
    icon: ScanLine,
    step: "Then",
    title: "It cross-checks them",
    body: "22 controls run: is the GST number real, has this invoice number been paid before, does the amount match the purchase order, did the vendor's bank account change just before billing. Checks that need two documents only run when both are present.",
  },
  {
    icon: Gauge,
    step: "Finally",
    title: "You get a decision",
    body: "Every control comes back pass, warning or failed, each with the exact value it compared. Above them sits one risk score, one confidence score, and a ranked list of what to do — starting with whether to release the payment.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative z-10 border-t border-border/60 py-24">
      <div className="container">
        <div className="mx-auto max-w-[52ch] text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tighter">
            What actually happens
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Someone in accounts payable does this by hand today. It takes about forty
            minutes a bundle, and the two mistakes that cost real money are the two a
            tired reader misses.
          </p>
        </div>

        <ol className="mx-auto mt-14 grid max-w-[1000px] gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, body }) => (
            <li key={title} className="glass glass-hover p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]">
                  <Icon className="size-4 text-primary" />
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {step}
                </span>
              </div>
              <h3 className="mt-4 text-[16px] font-medium tracking-tight">{title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const REAL = [
  "Creating cases and uploading documents",
  "Storing case data in Postgres, so it survives a restart",
  "Search, risk and confidence scoring, report export",
  "The 22-control catalog and how each one is weighted",
];

const NOT_REAL = [
  "The findings themselves — no model is called and nothing is read from your files",
  "The registry lookups (GSTN, MCA21, sanctions lists) are not contacted",
  "Amounts, GST numbers and account numbers shown in findings are generated",
];

export function HonestyPanel() {
  return (
    <section className="relative z-10 border-t border-border/60 py-24">
      <div className="container">
        <div className="mx-auto max-w-[52ch] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] text-muted-foreground">
            <ShieldQuestion className="size-3.5" />
            Read this before you judge the output
          </span>
          <h2 className="mt-6 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tighter">
            This is a demo build
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            The product around the findings is real and working. The findings are
            simulated. Mixing those up is how demos mislead people, so here is the line,
            drawn plainly.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-[880px] gap-4 md:grid-cols-2">
          <div className="glass p-6">
            <h3 className="flex items-center gap-2 text-[14px] font-medium tracking-tight text-pass">
              <CircleCheck className="size-4" />
              Real and working
            </h3>
            <ul className="mt-4 space-y-2.5">
              {REAL.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground"
                >
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-pass" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass p-6">
            <h3 className="flex items-center gap-2 text-[14px] font-medium tracking-tight text-warn">
              <Ban className="size-4" />
              Simulated
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NOT_REAL.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground"
                >
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-warn" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-[62ch] text-center text-[13px] leading-relaxed text-muted-foreground/80">
          Findings are drawn from the control catalog by a random generator seeded from
          the case id. That means two cases look nothing alike, but the same case shows
          the same findings every time you open it — a report that changed while you read
          it would be worth nothing.
        </p>
      </div>
    </section>
  );
}
