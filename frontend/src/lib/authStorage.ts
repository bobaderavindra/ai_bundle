import type { AuthTokens } from "../types";

const KEY = "investai.auth";

export function loadAuth(): AuthTokens | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function saveAuth(auth: AuthTokens | null): void {
  if (!auth) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function parseRoleFromJwt(token: string): "USER" | "ADMIN" {
  try {
    const payloadRaw = token.split(".")[1];
    const payload = JSON.parse(atob(payloadRaw));
    const role = String(payload.role || "USER").toUpperCase();
    return role === "ADMIN" ? "ADMIN" : "USER";
  } catch {
    return "USER";
  }
}
