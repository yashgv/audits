"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Database,
  LayoutGrid,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Wordmark } from "@/components/brand";
import { cn, initialsOf } from "@/lib/utils";
import { signOut } from "@/app/login/actions";
import type { SessionUser } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/investigations/new", label: "New investigation", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({
  user,
  persistent,
  showSignOut,
}: {
  user: SessionUser;
  persistent: boolean;
  showSignOut: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSignOut = () =>
    startTransition(async () => {
      await signOut();
      router.replace("/");
      router.refresh();
    });

  return (
    <aside className="no-print flex shrink-0 flex-col border-b border-border/70 bg-surface/60 backdrop-blur-xl md:h-screen md:w-[248px] md:border-b-0 md:border-r">
      <div className="flex h-16 items-center justify-between px-5 md:h-20">
        <Link href="/dashboard" className="transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[12px] text-muted-foreground md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        className={cn(
          "flex-1 space-y-1 px-3 pb-4 md:block",
          open ? "block" : "hidden",
        )}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/investigations/inv")
              : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-md border border-white/[0.08] bg-white/[0.06]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="px-3 pt-6">
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
            Environment
          </p>
          <div className="mt-3 space-y-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <Database className="size-3.5" />
              {persistent ? "Postgres connected" : "In-memory store"}
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3.5" />
              22 controls loaded
            </span>
            {!showSignOut ? (
              <span className="flex items-center gap-2">
                <Users className="size-3.5" />
                Open workspace · no sign-in
              </span>
            ) : null}
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-border/70 p-3 md:block",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11.5px] font-semibold text-primary">
            {initialsOf(user.name ?? user.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{user.name ?? "Analyst"}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {showSignOut ? user.email : "Shared demo workspace"}
            </p>
          </div>
          {showSignOut ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={pending}
              title="Sign out"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
            >
              <LogOut className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
