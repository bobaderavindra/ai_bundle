import { FormEvent, useState } from "react";
import { useAuth } from "../state/AuthContext";

export default function LoginPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("user@investai.com");
  const [fullName, setFullName] = useState("Demo User");
  const [password, setPassword] = useState("Pass@123");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(email, fullName, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  return (
    <form className="card auth-card" onSubmit={onSubmit}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      {mode === "register" && (
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
      )}
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      {error && <div className="error">{error}</div>}
      <button type="submit">{mode === "login" ? "Sign In" : "Create Account"}</button>
      <button
        type="button"
        className="ghost"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Need account?" : "Have account?"}
      </button>
    </form>
  );
}
