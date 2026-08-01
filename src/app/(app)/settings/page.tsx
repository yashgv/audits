import { CircleCheck, CircleDashed } from "lucide-react";
import { CHECKS } from "@/lib/investigation/catalog";
import { requireUser } from "@/lib/auth";
import { getStats, usingDatabase } from "@/lib/db";
import { hasSupabase } from "@/lib/env";
import { formatINR } from "@/lib/utils";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const stats = await getStats(user.id);

  const categories = [...new Set(CHECKS.map((c) => c.category))];

  return (
    <div className="mx-auto max-w-[860px] px-6 py-10 sm:px-10 sm:py-12">
      <div className="animate-fade-up">
        <h1 className="text-[30px] font-semibold leading-tight tracking-tighter">Settings</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Your profile, the environment this build is running against, and what the engine
          checks.
        </p>
      </div>

      <section className="glass mt-8 animate-fade-up p-7 [animation-delay:60ms]">
        <h2 className="text-[15px] font-medium tracking-tight">Profile</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Signed in as <span className="font-mono text-foreground/80">{user.email}</span>
        </p>
        <div className="mt-6">
          <ProfileForm name={user.name ?? ""} org={user.org ?? ""} />
        </div>
      </section>

      <section className="glass mt-6 animate-fade-up p-7 [animation-delay:120ms]">
        <h2 className="text-[15px] font-medium tracking-tight">Environment</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Both services degrade to a local equivalent so the app never hard-fails on a
          missing key.
        </p>
        <div className="mt-5 space-y-3">
          <Capability
            on={hasSupabase}
            title="Supabase authentication"
            onText="Live — sessions are managed by your Supabase project."
            offText="Not configured — a local browser session stands in. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to switch it on."
          />
          <Capability
            on={usingDatabase}
            title="Postgres via Prisma"
            onText="Live — cases persist across restarts."
            offText="Not configured — cases live in memory and reset when the server restarts. Set DATABASE_URL and run `npx prisma migrate dev`."
          />
        </div>
      </section>

      <section className="glass mt-6 animate-fade-up p-7 [animation-delay:180ms]">
        <h2 className="text-[15px] font-medium tracking-tight">Control catalog</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {CHECKS.length} controls across {categories.length} categories. Each case runs the
          subset its documents make applicable.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {CHECKS.map((c) => (
            <div
              key={c.code}
              className="flex items-center gap-2.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <span className="font-mono text-[10.5px] text-muted-foreground">{c.code}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{c.label}</span>
              <span className="shrink-0 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
                {c.category}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass mt-6 animate-fade-up p-7 [animation-delay:240ms]">
        <h2 className="text-[15px] font-medium tracking-tight">Your usage</h2>
        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Fact label="Cases" value={String(stats.total)} />
          <Fact label="Completed" value={String(stats.completed)} />
          <Fact label="Flagged" value={String(stats.flagged)} />
          <Fact label="Exposure found" value={formatINR(stats.exposure)} />
        </div>
      </section>
    </div>
  );
}

function Capability({
  on,
  title,
  onText,
  offText,
}: {
  on: boolean;
  title: string;
  onText: string;
  offText: string;
}) {
  const Icon = on ? CircleCheck : CircleDashed;
  return (
    <div className="flex items-start gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <Icon className={`mt-0.5 size-4 shrink-0 ${on ? "text-pass" : "text-muted-foreground"}`} />
      <div>
        <p className="text-[13.5px] font-medium">{title}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {on ? onText : offText}
        </p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[22px] font-semibold tracking-tighter tabular-nums">{value}</p>
    </div>
  );
}
