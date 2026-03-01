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
      <main className="shell">
        <HeaderBar />
        <div className="center">
          <LoginPanel />
        </div>
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
