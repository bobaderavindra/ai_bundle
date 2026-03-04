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
    <form className="login-card" onSubmit={onSubmit}>
      <h2>{mode === "login" ? "Sign in" : "Create your account"}</h2>
      <p className="login-subtitle">
        {mode === "login" ? "Stay updated on your portfolio performance." : "Start with your team workspace in minutes."}
      </p>

      <label className="login-label" htmlFor="email">
        Email
      </label>
      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />

      {mode === "register" && (
        <>
          <label className="login-label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </>
      )}

      <label className="login-label" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Enter password"
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" className="login-submit">
        {mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="login-switch">
        {mode === "login" ? "New to InvestAI?" : "Already have an account?"}
        <button
          type="button"
          className="login-inline-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Join now" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
