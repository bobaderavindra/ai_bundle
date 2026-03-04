import HeaderBar from "./components/HeaderBar";
import LoginPanel from "./components/LoginPanel";
import StockTicker from "./components/StockTicker";
import CandleChart from "./components/CandleChart";
import AllocationChart from "./components/AllocationChart";
import StrategyBuilder from "./components/StrategyBuilder";
import TradePanel from "./components/TradePanel";
import RoleGate from "./components/RoleGate";
import AdminPanel from "./components/AdminPanel";
import { useAuth } from "./state/AuthContext";

export default function App() {
  const { auth } = useAuth();

  if (!auth) {
    return (
      <main className="auth-shell">
        <header className="auth-topbar">
          <div className="auth-brand">
            <span className="auth-brand-text">InvestAI</span>
            <span className="auth-brand-mark">in</span>
          </div>
          <a className="auth-top-link" href="#login">
            Sign in
          </a>
        </header>

        <section className="auth-layout">
          <article className="auth-hero">
            <p className="auth-kicker">Welcome back</p>
            <h1>Build smarter portfolios with AI-driven insights.</h1>
            <p>
              Analyze risk, optimize allocation, and execute strategy in one platform designed for modern investment
              teams.
            </p>
            <div className="auth-hero-metrics">
              <div className="auth-metric">
                <strong>3 Services</strong>
                <span>Risk, Research, Optimization</span>
              </div>
              <div className="auth-metric">
                <strong>Real-time</strong>
                <span>Portfolio intelligence</span>
              </div>
              <div className="auth-metric">
                <strong>Secure</strong>
                <span>JWT-based access control</span>
              </div>
            </div>
          </article>
          <div id="login">
            <LoginPanel />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <HeaderBar />
      <section className="grid">
        <StockTicker />
        <TradePanel />
        <CandleChart />
        <AllocationChart />
        <StrategyBuilder />
        <RoleGate role="ADMIN">
          <AdminPanel />
        </RoleGate>
      </section>
    </main>
  );
}
