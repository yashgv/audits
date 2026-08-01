import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { store } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const DEMO_COOKIE = "veritas_demo_session";

/**
 * Resolves the signed-in user.
 *
 * With Supabase configured this reads the real session. Without it, a local
 * cookie session stands in so the product is demonstrable out of the box.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
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
