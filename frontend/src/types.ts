export type Role = "USER" | "ADMIN";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  email: string;
  userId: string;
  role: Role;
}

export interface PriceTick {
  symbol: string;
  price: number;
  ts: number;
}

export interface StrategyBlock {
  id: string;
  kind: "INDICATOR" | "CONDITION" | "ACTION";
  label: string;
}
