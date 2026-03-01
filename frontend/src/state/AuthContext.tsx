import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { api } from "../lib/api";
import { loadAuth, parseRoleFromJwt, saveAuth } from "../lib/authStorage";
import type { AuthTokens } from "../types";

interface AuthContextValue {
  auth: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthTokens | null>(() => loadAuth());

  async function login(email: string, password: string) {
    const res = await api<{
      accessToken: string;
      refreshToken: string;
      email: string;
      userId: string;
      role?: "USER" | "ADMIN";
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    const role = res.role || parseRoleFromJwt(res.accessToken);
    const next: AuthTokens = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      email: res.email,
      userId: res.userId,
      role
    };
    setAuth(next);
    saveAuth(next);
  }

  async function register(email: string, fullName: string, password: string) {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, fullName, password })
    });
    await login(email, password);
  }

  function logout() {
    setAuth(null);
    saveAuth(null);
  }

  const value = useMemo(() => ({ auth, login, register, logout }), [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
