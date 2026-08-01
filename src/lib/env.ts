/**
 * Capability detection.
 *
 * The app is fully usable with zero configuration — it falls back to a local
 * demo session and an in-memory store. Add the env vars and the same code paths
 * light up against Supabase Auth and Postgres. Nothing else changes.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const hasSupabase = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    supabaseAnonKey.length > 20,
);

export const hasDatabase = Boolean(
  process.env.DATABASE_URL?.trim()?.startsWith("postgres"),
);
