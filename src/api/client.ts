import { getSupabaseAccessToken, getSupabaseRuntimeConfig } from "../auth/supabase";

export function getApiUrl(): string {
  const supabase = getSupabaseRuntimeConfig();
  if (supabase) return `${supabase.url}/functions/v1/api`;
  return (import.meta.env.VITE_API_URL ?? "http://localhost:8000").trim();
}

export async function buildApiHeaders(initialHeaders?: HeadersInit): Promise<Headers> {
  const headers = new Headers(initialHeaders ?? {});
  const supabase = getSupabaseRuntimeConfig();

  if (supabase) {
    headers.set("apikey", supabase.anonKey);

    if (!headers.has("Authorization")) {
      const accessToken = await getSupabaseAccessToken();
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
    }
  }

  return headers;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await buildApiHeaders(init.headers);
  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
  });
}
