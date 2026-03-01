import type { PropsWithChildren } from "react";
import { useAuth } from "../state/AuthContext";

export default function RoleGate({ role, children }: PropsWithChildren<{ role: "USER" | "ADMIN" }>) {
  const { auth } = useAuth();
  if (!auth || auth.role !== role) return null;
  return <>{children}</>;
}
