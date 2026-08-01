import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OPEN_WORKSPACE, authEnabled, hasSupabase } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { store } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const DEMO_COOKIE = "veritas_demo_session";

/**
 * Resolves the current user.
 *
 * Three modes, in order of precedence:
 *
 *   1. Sign-in off (the default) — everyone shares one open workspace and there
 *      is no login screen at all.
 *   2. Sign-in on + Supabase keys — the real Supabase session.
 *   3. Sign-in on, no keys — a local cookie session scoped to the browser.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!authEnabled) {
    return store.ensureUser({ ...OPEN_WORKSPACE });
  }

  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase!.auth.getUser();
    if (!data.user?.email) return null;
    return store.ensureUser({
      authId: data.user.id,
      email: data.user.email,
      name:
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        null,
    });
  }

  const jar = await cookies();
  const raw = jar.get(DEMO_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as { email?: string; name?: string };
    if (!parsed.email) return null;
    return store.ensureUser({
      authId: `demo:${parsed.email.toLowerCase()}`,
      email: parsed.email.toLowerCase(),
      name: parsed.name ?? null,
    });
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function encodeDemoSession(email: string, name?: string | null) {
  return Buffer.from(JSON.stringify({ email, name }), "utf8").toString("base64url");
}
