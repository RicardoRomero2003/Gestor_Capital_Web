import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

type SupabaseRuntimeConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const config = getSupabaseRuntimeConfig();
  if (!config) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY para autenticar.");
  }

  cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}
