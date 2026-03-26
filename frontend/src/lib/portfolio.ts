import { api } from "./api";
import type { AuthTokens } from "../types";

export interface PortfolioOption {
  id: string;
  name: string;
}

export async function fetchPortfolios(auth: AuthTokens): Promise<PortfolioOption[]> {
  return api<PortfolioOption[]>(`/portfolio/${auth.userId}`, {}, auth.accessToken);
}

export async function createPortfolio(auth: AuthTokens, name: string): Promise<PortfolioOption> {
  return api<PortfolioOption>(
    "/portfolio",
    {
      method: "POST",
      body: JSON.stringify({ name })
    },
    auth.accessToken
  );
}

export async function ensureDefaultPortfolios(
  auth: AuthTokens,
  names: string[]
): Promise<PortfolioOption[]> {
  const existing = await fetchPortfolios(auth);
  if (existing.length) return existing;

  const created: PortfolioOption[] = [];
  for (const name of names) {
    const portfolio = await api<PortfolioOption>(
      "/portfolio",
      {
        method: "POST",
        body: JSON.stringify({ name })
      },
      auth.accessToken
    );
    created.push(portfolio);
  }
  return created;
}
