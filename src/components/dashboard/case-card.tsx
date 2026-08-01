import Link from "next/link";
import { ArrowUpRight, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RISK_META, riskTone } from "@/lib/risk";
import { relativeTime } from "@/lib/utils";
import type { InvestigationRecord } from "@/lib/types";

export function CaseCard({ record }: { record: InvestigationRecord }) {
  const level = record.riskLevel;
  const meta = level ? RISK_META[level] : null;
  const failures = record.result?.metrics.failures ?? 0;
  const warnings = record.result?.metrics.warnings ?? 0;

  return (
    <Link
      href={`/investigations/${record.id}`}
      className="glass glass-hover group block overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {record.reference}
          </p>
          <h3 className="mt-1.5 truncate text-[15px] font-medium tracking-tight">
            {record.title}
          </h3>
          {record.subject ? (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {record.subject}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {record.status === "COMPLETED" && meta ? (
            <div className="text-right">
              <p
                className="text-[26px] font-semibold leading-none tracking-tighter tabular-nums"
                style={{ color: meta.color }}
              >
                {record.riskScore}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                risk
              </p>
            </div>
          ) : (
            <Badge tone="primary">Pending</Badge>
          )}
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {record.status === "COMPLETED" && level ? (
          <Badge tone={riskTone(level)}>{meta!.short}</Badge>
        ) : null}
        {failures > 0 ? <Badge tone="fail">{failures} failed</Badge> : null}
        {warnings > 0 ? <Badge tone="warn">{warnings} warnings</Badge> : null}
        {record.status === "COMPLETED" && failures === 0 && warnings === 0 ? (
          <Badge tone="pass">All controls passed</Badge>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileText className="size-3.5" />
          {record.documents.length} document{record.documents.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {relativeTime(record.createdAt)}
        </span>
      </div>
    </Link>
  );
}
