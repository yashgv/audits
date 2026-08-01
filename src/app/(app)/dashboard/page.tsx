import Link from "next/link";
import { Plus, TriangleAlert, CircleCheck, Info, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/viz/meters";
import { CaseCard } from "@/components/dashboard/case-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { requireUser } from "@/lib/auth";
import { getStats, store } from "@/lib/db";
import { formatINR, relativeTime } from "@/lib/utils";
import { RISK_META } from "@/lib/risk";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await requireUser();
  const [cases, stats] = await Promise.all([
    store.listInvestigations(user.id, q),
    getStats(user.id),
  ]);

  const firstName = (user.name ?? user.email).split(/[@.\s]/)[0];
  const activity = cases.filter((c) => c.status === "COMPLETED").slice(0, 6);
  const isSearching = Boolean(q?.trim());

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 sm:py-12">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold capitalize leading-tight tracking-tighter">
            {firstName}&apos;s workspace
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {stats.total === 0
              ? "Nothing under review right now."
              : `${stats.total} case${stats.total === 1 ? "" : "s"} on file · ${stats.flagged} need attention.`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput initial={q ?? ""} />
          <Button asChild>
            <Link href="/investigations/new">
              <Plus />
              New investigation
            </Link>
          </Button>
        </div>
      </div>

      {/* What this is — the first thing a newcomer needs */}
      <div className="glass mt-7 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <Info className="size-4 shrink-0 text-primary" />
        <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
          <span className="text-foreground">A case is one transaction under review.</span>{" "}
          Add the documents behind it and Veritas runs 22 compliance controls across them,
          then tells you whether to release the payment. Findings are simulated in this
          demo build — the workflow around them is real.
        </p>
        <Link
          href="/investigations/new"
          className="shrink-0 text-[13px] text-primary underline-offset-4 hover:underline"
        >
          Try it →
        </Link>
      </div>

      {/* Quick stats */}
      {stats.completed > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Cases reviewed"
            value={String(stats.completed)}
            hint={`${stats.hoursSaved}h of manual review avoided`}
          />
          <StatTile
            label="Needs attention"
            value={String(stats.flagged)}
            hint="Risk score of 50 or above"
            accent={stats.flagged > 0}
          />
          <StatTile
            label="Exposure identified"
            value={formatINR(stats.exposure)}
            hint="Value sitting behind open exceptions"
          />
          <StatTile
            label="Mean confidence"
            value={`${stats.avgConfidence}%`}
            hint={`Average risk score ${stats.avgRisk}`}
          />
        </div>
      ) : null}

      {/* Cases */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
            {isSearching ? "Search results" : "Recent investigations"}
          </h2>
          {isSearching ? (
            <Link
              href="/dashboard"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </Link>
          ) : null}
        </div>

        {cases.length === 0 ? (
          isSearching ? (
            <div className="glass px-6 py-14 text-center">
              <p className="text-[14px] text-muted-foreground">
                No case matches &ldquo;{q}&rdquo;.
              </p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {cases.map((record, i) => (
              <div
                key={record.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <CaseCard record={record} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      {activity.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-[13px] uppercase tracking-[0.16em] text-muted-foreground">
            Recent activity
          </h2>
          <div className="glass divide-y divide-white/[0.05]">
            {activity.map((record) => {
              const failures = record.result?.metrics.failures ?? 0;
              const warnings = record.result?.metrics.warnings ?? 0;
              const Icon =
                failures > 0 ? ShieldAlert : warnings > 0 ? TriangleAlert : CircleCheck;
              const tone =
                failures > 0 ? "text-fail" : warnings > 0 ? "text-warn" : "text-pass";

              return (
                <Link
                  key={record.id}
                  href={`/investigations/${record.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
                >
                  <Icon className={`size-4 shrink-0 ${tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px]">
                      <span className="font-medium">{record.title}</span>
                      <span className="text-muted-foreground">
                        {" — "}
                        {failures > 0
                          ? `${failures} control${failures === 1 ? "" : "s"} failed`
                          : warnings > 0
                            ? `${warnings} warning${warnings === 1 ? "" : "s"} raised`
                            : "cleared with no exceptions"}
                      </span>
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:block">
                    {record.riskLevel ? RISK_META[record.riskLevel].short : "—"}
                  </span>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                    {relativeTime(record.completedAt ?? record.createdAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
