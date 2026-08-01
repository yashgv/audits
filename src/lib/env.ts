/**
 * Capability detection.
 *
 * The app is fully usable with zero configuration. Each capability degrades to a
 * local equivalent rather than failing, and the Settings page reports which mode
 * is live.
 */

/**
 * Sign-in is OFF by default so anyone can open the app and use it immediately.
 *
 * To turn real authentication back on, set NEXT_PUBLIC_AUTH_ENABLED=true in
 * .env alongside the two Supabase keys below. No code changes are needed —
 * every auth code path is still here, just skipped.
 */
export const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const hasSupabase = Boolean(
  authEnabled &&
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey.length > 20,
);

export const hasDatabase = Boolean(
  process.env.DATABASE_URL?.trim()?.startsWith("postgres"),
);

/** The single shared workspace used when sign-in is off. */
export const OPEN_WORKSPACE = {
  authId: "open-workspace",
  email: "analyst@veritas.demo",
  name: "Analyst",
} as const;
