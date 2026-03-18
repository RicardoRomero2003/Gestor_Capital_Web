import type { ApiSessionUser } from "../auth/types";
import { getSupabaseClient } from "../auth/supabase";
import { apiFetch } from "./client";

const SYNTHETIC_AUTH_DOMAIN = "users.capify.local";

function parseSignInErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Credenciales invalidas.";
  if (normalized.includes("email not confirmed")) return "Confirma tu correo en Supabase para iniciar sesion.";
  if (normalized.includes("email address") && normalized.includes("invalid")) {
    return "Usuario invalido. Usa letras, numeros, punto, guion o guion bajo.";
  }
  return message;
}

function normalizeIdentifier(rawIdentifier: string): string {
  return rawIdentifier
    .normalize("NFKC")
    .replace(/["'\u201c\u201d\u2018\u2019]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

function buildLocalPart(identifier: string): string {
  const transliterated = identifier
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const cleaned = transliterated
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/[.]{2,}/g, ".")
    .replace(/^[-._]+|[-._]+$/g, "");

  return cleaned.slice(0, 50);
}

function resolveSupabaseEmail(identifier: string): string {
  if (isEmail(identifier)) return identifier;

  const localPart = buildLocalPart(identifier);
  if (!localPart) {
    throw new Error("Usuario invalido. Introduce al menos una letra o numero.");
  }

  return `${localPart}@${SYNTHETIC_AUTH_DOMAIN}`;
}

function resolveProfileUsername(identifier: string): string {
  if (!identifier) return "usuario";
  if (isEmail(identifier)) {
    const alias = identifier.split("@")[0]?.trim() ?? "usuario";
    return alias.slice(0, 45);
  }
  return identifier.slice(0, 45);
}

async function parseApiError(response: Response): Promise<string> {
  const bodyText = await response.text().catch(() => "");
  if (bodyText) {
    try {
      const payload = JSON.parse(bodyText) as { detail?: string; message?: string };
      if (payload?.detail) return payload.detail;
      if (payload?.message) return payload.message;
    } catch {
      return bodyText;
    }
  }
  return `Error ${response.status}`;
}

async function getApiSessionUser(accessToken?: string): Promise<ApiSessionUser> {
  const response = await apiFetch(`/me`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    if (bodyText) {
      try {
        const payload = JSON.parse(bodyText) as { detail?: string };
        if (payload?.detail) throw new Error(payload.detail);
      } catch {
        throw new Error(`Error /me (${response.status}): ${bodyText}`);
      }
    }
    throw new Error(`Error /me (${response.status})`);
  }
  return (await response.json()) as ApiSessionUser;
}

export async function loginWithSupabase(usuario: string, password: string): Promise<ApiSessionUser> {
  const identifier = normalizeIdentifier(usuario);
  if (!identifier) {
    throw new Error("Introduce un usuario valido.");
  }
  const email = resolveSupabaseEmail(identifier);
  const plainPassword = password;
  const client = getSupabaseClient();

  const signInRes = await client.auth.signInWithPassword({
    email,
    password: plainPassword,
  });

  if (signInRes.error) {
    throw new Error(parseSignInErrorMessage(signInRes.error.message));
  }

  const accessToken = signInRes.data.session?.access_token;
  if (!accessToken) {
    throw new Error("Sesion creada sin access token. Revisa Email provider en Supabase.");
  }

  return getApiSessionUser(accessToken);
}

export async function registerWithSupabase(usuario: string, password: string): Promise<void> {
  const identifier = normalizeIdentifier(usuario);
  if (!identifier) {
    throw new Error("Introduce un usuario valido.");
  }

  const response = await apiFetch("/registro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario: identifier,
      password,
      correo: resolveSupabaseEmail(identifier),
      username: resolveProfileUsername(identifier),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
}

export async function getCurrentSessionUser(): Promise<ApiSessionUser | null> {
  const client = getSupabaseClient();
  const { data } = await client.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return null;
  }

  try {
    return await getApiSessionUser(accessToken);
  } catch {
    return null;
  }
}

export async function logoutSupabaseSession(): Promise<void> {
  const client = getSupabaseClient();
  await client.auth.signOut();
}
