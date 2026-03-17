import type { ApiSessionUser } from "../auth/types";
import { getSupabaseClient } from "../auth/supabase";
import { apiFetch } from "./client";

function parseSignInErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Credenciales invalidas.";
  if (normalized.includes("email not confirmed")) return "Confirma tu correo en Supabase para iniciar sesion.";
  return message;
}

function shouldTryForcedSignUp(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return normalized.includes("invalid login credentials") || normalized.includes("user not found");
}

function normalizeLoginEmail(rawEmail: string): string {
  return rawEmail
    .normalize("NFKC")
    .replace(/["'\u201c\u201d\u2018\u2019]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
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

export async function loginWithSupabase(correo: string, password: string): Promise<ApiSessionUser> {
  const email = normalizeLoginEmail(correo);
  const plainPassword = password;
  const client = getSupabaseClient();

  let signInRes = await client.auth.signInWithPassword({
    email,
    password: plainPassword,
  });

  if (signInRes.error) {
    const originalMessage = parseSignInErrorMessage(signInRes.error.message);

    if (!shouldTryForcedSignUp(signInRes.error.message)) {
      throw new Error(originalMessage);
    }

    const signUpRes = await client.auth.signUp({
      email,
      password: plainPassword,
      options: {
        data: {
          username: (email.split("@")[0] ?? "usuario").slice(0, 45),
        },
      },
    });

    if (signUpRes.error && !signUpRes.error.message.toLowerCase().includes("already registered")) {
      throw new Error(parseSignInErrorMessage(signUpRes.error.message));
    }

    signInRes = await client.auth.signInWithPassword({ email, password: plainPassword });
    if (signInRes.error) {
      throw new Error(parseSignInErrorMessage(signInRes.error.message));
    }
  }

  const accessToken = signInRes.data.session?.access_token;
  if (!accessToken) {
    throw new Error("Sesion creada sin access token. Revisa Email provider en Supabase.");
  }

  return getApiSessionUser(accessToken);
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
