import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Gauge, Layers, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskDial, ConfidenceMeter } from "@/components/viz/meters";
import { FindingsPanel } from "@/components/investigation/findings-panel";
import { HowToRead } from "@/components/investigation/how-to-read";
import { ReportActions } from "@/components/investigation/report-actions";
import { RunTimeline } from "@/components/investigation/run-timeline";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db";
import { buildMarkdownReport } from "@/lib/report";
import { RISK_META, riskTone } from "@/lib/risk";
import { formatBytes, formatDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIORITY_TONE = {
  immediate: "fail",
  "before-payment": "warn",
  routine: "neutral",
} as const;

const PRIORITY_LABEL = {
  immediate: "Immediate",
  "before-payment": "Before payment",
  routine: "Routine",
} as const;

export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const record = await store.getInvestigation(user.id, id);
  if (!record) notFound();

  /* ---------- Still running ---------- */
  if (record.status !== "COMPLETED" || !record.result) {
    return (
      <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 sm:py-12">
        <Header record={record} />
        <RunTimeline id={record.id} documents={record.documents} />
      </div>
    );
  }

  const result = record.result;
  const meta = RISK_META[result.riskLevel];

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 sm:py-12">
      <Header record={record} actions={<ReportActions record={record} />} />

      {/* ---------- Verdict ---------- */}
      <section className="glass noise mt-7 grid gap-8 p-7 animate-fade-up lg:grid-cols-[240px_minmax(0,1fr)_260px] lg:gap-10">
        <RiskDial score={result.riskScore} level={result.riskLevel} />

        <div className="flex flex-col justify-center border-y border-white/[0.06] py-6 lg:border-x lg:border-y-0 lg:px-9 lg:py-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={riskTone(result.riskLevel)}>{meta.label}</Badge>
            {result.metrics.failures > 0 ? (
              <Badge tone="fail">{result.metrics.failures} controls failed</Badge>
            ) : null}
            {result.metrics.warnings > 0 ? (
              <Badge tone="warn">{result.metrics.warnings} warnings</Badge>
            ) : null}
            <Badge tone="pass">{result.metrics.passed} passed</Badge>
          </div>

          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-foreground/90">
            {result.summary}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Metric icon={Layers} label="Controls" value={String(result.metrics.checksRun)} />
            <Metric icon={FileText} label="Documents" value={String(result.metrics.documentsAnalyzed)} />
            <Metric
              icon={Gauge}
              label="Exposure"
              value={result.metrics.exposure > 0 ? formatINR(result.metrics.exposure) : "—"}
            />
            <Metric
              icon={Timer}
              label="Runtime"
              value={`${(result.metrics.processingMs / 1000).toFixed(1)}s`}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <ConfidenceMeter value={result.confidence} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------- Left ---------- */}
        <div className="space-y-6">
          <div className="animate-fade-up [animation-delay:60ms]">
            <FindingsPanel findings={result.findings} />
          </div>

          <div className="animate-fade-up [animation-delay:90ms]">
            <HowToRead />
          </div>

          <section className="glass animate-fade-up p-6 [animation-delay:120ms]">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
              Recommended actions
            </h2>
            <ol className="mt-4 space-y-3">
              {result.actions.map((action, i) => (
                <li
                  key={action.id}
                  className="flex gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-[11.5px] font-medium tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-medium tracking-tight">{action.title}</p>
                      <Badge tone={PRIORITY_TONE[action.priority]}>
                        {PRIORITY_LABEL[action.priority]}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      {action.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="glass animate-fade-up overflow-hidden [animation-delay:180ms]">
            <div className="border-b border-white/[0.06] px-6 py-4">
              <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
                Report preview
              </h2>
              <p className="mt-1 text-[12.5px] text-muted-foreground/80">
                Exactly what &ldquo;Export report&rdquo; writes to disk.
              </p>
            </div>
            <pre className="max-h-[340px] overflow-auto p-6 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
              {buildMarkdownReport(record)}
            </pre>
          </section>
        </div>

        {/* ---------- Right ---------- */}
        <div className="space-y-6">
          <section className="glass animate-fade-up p-6 [animation-delay:90ms]">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
              Extracted fields
            </h2>
            <dl className="mt-4 space-y-3">
              {result.ledger.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4">
                  <dt className="shrink-0 text-[12.5px] text-muted-foreground">{row.label}</dt>
                  <dd
                    className={`min-w-0 truncate text-right text-[12.5px] text-foreground/90 ${
                      row.mono ? "font-mono" : ""
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="glass animate-fade-up p-6 [animation-delay:150ms]">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
              Evidence in scope
            </h2>
            <ul className="mt-4 space-y-3">
              {record.documents.map((doc) => (
                <li key={doc.id} className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{doc.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {doc.docType} · {formatBytes(doc.size)}
                    </p>
                    <p className="truncate font-mono text-[10.5px] text-muted-foreground/70">
                      {doc.fingerprint}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {record.notes ? (
            <section className="glass animate-fade-up p-6 [animation-delay:210ms]">
              <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
                Analyst context
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {record.notes}
              </p>
            </section>
          ) : null}

          <p className="px-1 text-[11.5px] leading-relaxed text-muted-foreground/70">
            Demo build. Findings are generated from a control catalog with a seed derived
            from the case id — reproducible, but not a real filing.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header({
  record,
  actions,
}: {
  record: { reference: string; title: string; subject: string | null; createdAt: string };
  actions?: React.ReactNode;
}) {
  return (
    <>
      <Link
        href="/dashboard"
        className="no-print inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Dashboard
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {record.reference} · opened {formatDate(record.createdAt)}
          </p>
          <h1 className="mt-1.5 text-balance text-[28px] font-semibold leading-tight tracking-tighter">
            {record.title}
          </h1>
          {record.subject ? (
            <p className="mt-1 text-[14px] text-muted-foreground">{record.subject}</p>
          ) : null}
        </div>
        {actions}
      </div>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-[18px] font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
