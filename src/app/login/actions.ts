"use server";

import { cookies } from "next/headers";
import { DEMO_COOKIE, encodeDemoSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { credentialsSchema } from "@/lib/validations";

export type AuthResult = { ok: true } | { ok: false; message: string };

export async function authenticate(
  raw: { email: string; password: string },
  mode: "signin" | "signup",
): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your details" };
  }
  const { email, password } = parsed.data;

  if (!hasSupabase) {
    // No Supabase project configured — issue a local workspace session so the
    // product is fully explorable. Sessions are per-browser and never shared.
    const jar = await cookies();
    jar.set(DEMO_COOKIE, encodeDemoSession(email), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Authentication is not available right now" };

  if (mode === "signup") {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return {
        ok: false,
        message: "Account created. Confirm your email address, then sign in.",
      };
    }
    return { ok: true };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      ok: false,
      message:
        error.message === "Invalid login credentials"
          ? "That email and password combination does not match an account."
          : error.message,
    };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);

  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }
}
