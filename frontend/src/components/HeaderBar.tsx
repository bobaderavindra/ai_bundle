import { useTheme } from "../state/ThemeContext";
import { useAuth } from "../state/AuthContext";

export default function HeaderBar() {
  const { theme, setTheme } = useTheme();
  const { auth, logout } = useAuth();

  return (
    <header className="header">
      <div>
        <h1>InvestAI Fintech Console</h1>
        <p>Enterprise portfolio intelligence</p>
      </div>
      <div className="header-actions">
        <select value={theme} onChange={(e) => setTheme(e.target.value as "ocean" | "sand" | "slate")}>
          <option value="ocean">Ocean</option>
          <option value="sand">Sand</option>
          <option value="slate">Slate</option>
        </select>
        {auth && (
          <>
            <span className="pill">{auth.role}</span>
            <span className="pill">{auth.email}</span>
            <button className="ghost" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
