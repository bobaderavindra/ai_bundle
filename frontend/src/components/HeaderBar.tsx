import { useTheme } from "../state/ThemeContext";
import { useAuth } from "../state/AuthContext";

export default function HeaderBar() {
  const { theme, setTheme } = useTheme();
  const { auth, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="header-brand-mark">in</span>
          <div>
            <h1>InvestAI</h1>
            <p>Enterprise portfolio intelligence</p>
          </div>
        </div>
        <nav className="header-menu" aria-label="Primary">
          <a href="#">Products</a>
          <a href="#">Solutions</a>
          <a href="#">Pricing</a>
          <a href="#">Docs</a>
          <a href="#">Support</a>
        </nav>
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
