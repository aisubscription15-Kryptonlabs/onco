"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

const STALE_REFRESH_TOKEN_RE = /invalid refresh token|refresh token not found/i;

export function isStaleRefreshTokenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return STALE_REFRESH_TOKEN_RE.test(message);
}

function clearSupabaseAuthCookies() {
  if (typeof document === "undefined") return;

  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name.startsWith("sb-") && name.includes("auth-token"));

  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

export function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith("sb-") || !key.includes("auth-token")) continue;
    window.localStorage.removeItem(key);
  }

  clearSupabaseAuthCookies();
}

export function clearMalformedSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;

    const value = window.localStorage.getItem(key) || "";
    if (/[\r\n]|SUPABASE_ACCESS_TOKEN|SUPABASE_SERVICE_ROLE_KEY/i.test(value)) {
      window.localStorage.removeItem(key);
    }
  }
}

export async function getRecoverableBrowserSession() {
  const supabase = supabaseBrowser();

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isStaleRefreshTokenError(error)) clearSupabaseAuthStorage();
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (error) {
    if (isStaleRefreshTokenError(error)) clearSupabaseAuthStorage();
    return { session: null, error };
  }
}

export function supabaseBrowser() {
  if (cached) return cached;
  cached = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return cached;
}
