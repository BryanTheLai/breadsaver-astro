import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error("Supabase env vars are not configured.") };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return { data: { user: null }, error: null };
  return supabase.auth.getUser();
}
