import { useEffect, useMemo, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import LoginPanel from "./components/LoginPanel";
import StockTicker from "./components/StockTicker";
import CandleChart from "./components/CandleChart";
import AllocationChart from "./components/AllocationChart";
import StrategyBuilder from "./components/StrategyBuilder";
import TradePanel from "./components/TradePanel";
import AdminPanel from "./components/AdminPanel";
import OptimizerPanel from "./components/OptimizerPanel";
import LifeMobileDashboard from "./components/LifeMobileDashboard";
import RecipeChatbotDashboard from "./components/RecipeChatbotDashboard";
import GroupExpenseDashboard from "./components/GroupExpenseDashboard";
import AddExpensePage from "./components/AddExpensePage";
import TimeSeriesShowcasePanel from "./components/TimeSeriesShowcasePanel";
import { useTimeSeriesShowcase } from "./hooks/useTimeSeriesShowcase";
import { getTimeSeriesScenario, type ScenarioId } from "./lib/timeSeriesShowcase";
import { useAuth } from "./state/AuthContext";

interface WidgetSize {
  colSpan: number;
  rowSpan: number;
}

interface WidgetDef {
  id: string;
  title: string;
  content: JSX.Element;
  adminOnly?: boolean;
  defaultSize: WidgetSize;
}

const MIN_COL_SPAN = 3;
const MAX_COL_SPAN = 12;
const MIN_ROW_SPAN = 1;
const MAX_ROW_SPAN = 4;
const GRID_LOCK_STORAGE_KEY = "investai.dashboard.gridLock";
const DASHBOARD_VIEW_STORAGE_KEY = "investai.dashboard.activeView";

export default function App() {
  const { auth } = useAuth();
  const [watchSymbols, setWatchSymbols] = useState<string[]>(["AAPL", "MSFT", "GOOGL", "TSLA"]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("AAPL");
  const [activeTimeSeriesScenarioId, setActiveTimeSeriesScenarioId] = useState<ScenarioId>("monthly-expenses");
  const [timeSeriesReloadKey, setTimeSeriesReloadKey] = useState(0);
  const activeTimeSeriesScenario = getTimeSeriesScenario(activeTimeSeriesScenarioId);
  const timeSeriesState = useTimeSeriesShowcase({
    accessToken: auth?.accessToken,
    scenario: activeTimeSeriesScenario,
    reloadKey: timeSeriesReloadKey
  });
  const timeSeriesPanel = (
    <TimeSeriesShowcasePanel
      activeScenarioId={activeTimeSeriesScenarioId}
      onScenarioChange={setActiveTimeSeriesScenarioId}
      onRefresh={() => setTimeSeriesReloadKey((current) => current + 1)}
      snapshot={timeSeriesState.snapshot}
      isLoading={timeSeriesState.isLoading}
      error={timeSeriesState.error}
    />
  );

  const widgetDefs = useMemo<WidgetDef[]>(
    () => [
      {
        id: "live-prices",
        title: "Live Prices",
        content: (
          <StockTicker
            symbols={watchSymbols}
            activeSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            onAddSymbol={(symbol) => {
              setWatchSymbols((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
              setSelectedSymbol(symbol);
            }}
          />
        ),
        defaultSize: { colSpan: 4, rowSpan: 1 }
      },
      {
        id: "trade-execution",
        title: "Trade Execution",
        content: <TradePanel />,
        defaultSize: { colSpan: 4, rowSpan: 2 }
      },
      {
        id: "advanced-chart",
        title: "Advanced Chart",
        content: <CandleChart symbol={selectedSymbol} />,
        defaultSize: { colSpan: 8, rowSpan: 2 }
      },
      {
        id: "time-series-studio",
        title: "Time Series Studio",
        content: timeSeriesPanel,
        defaultSize: { colSpan: 8, rowSpan: 3 }
      },
      {
        id: "portfolio-allocation",
        title: "Portfolio Allocation",
        content: <AllocationChart />,
        defaultSize: { colSpan: 4, rowSpan: 2 }
      },
      {
        id: "portfolio-optimizer",
        title: "Portfolio Optimizer",
        content: <OptimizerPanel symbols={watchSymbols} />,
        defaultSize: { colSpan: 8, rowSpan: 2 }
      },
      {
        id: "strategy-builder",
        title: "Strategy Builder",
        content: <StrategyBuilder />,
        defaultSize: { colSpan: 8, rowSpan: 2 }
      },
      {
        id: "admin-controls",
        title: "Admin Controls",
        content: <AdminPanel />,
        adminOnly: true,
        defaultSize: { colSpan: 4, rowSpan: 1 }
      }
    ],
    [selectedSymbol, timeSeriesPanel, watchSymbols]
  );

  const visibleWidgets = useMemo(
    () => (auth ? widgetDefs.filter((widget) => !widget.adminOnly || auth.role === "ADMIN") : []),
    [auth, widgetDefs]
  );

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => visibleWidgets.map((widget) => widget.id));
  const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>(() =>
    Object.fromEntries(visibleWidgets.map((widget) => [widget.id, widget.defaultSize]))
  );
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [isGridLocked, setIsGridLocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(GRID_LOCK_STORAGE_KEY) === "locked";
  });
  const [activeDashboard, setActiveDashboard] = useState<"classic" | "life" | "chatbot" | "settle">(() => {
    if (typeof window === "undefined") return "life";
    const savedView = window.localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
    if (savedView === "classic" || savedView === "life" || savedView === "chatbot" || savedView === "settle") {
      return savedView;
    }
    return "life";
  });
  const [isSettleExpenseOpen, setIsSettleExpenseOpen] = useState(false);

  useEffect(() => {
    const visibleIds = new Set(visibleWidgets.map((widget) => widget.id));

    setWidgetOrder((prev) => {
      const existing = prev.filter((id) => visibleIds.has(id));
      const missing = visibleWidgets.map((widget) => widget.id).filter((id) => !existing.includes(id));
      return [...existing, ...missing];
    });

    setWidgetSizes((prev) => {
      const next = { ...prev };
      for (const widget of visibleWidgets) {
        if (!next[widget.id]) next[widget.id] = widget.defaultSize;
      }
      return next;
    });
  }, [visibleWidgets]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GRID_LOCK_STORAGE_KEY, isGridLocked ? "locked" : "unlocked");
  }, [isGridLocked]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, activeDashboard);
  }, [activeDashboard]);

  useEffect(() => {
    if (activeDashboard !== "settle") {
      setIsSettleExpenseOpen(false);
    }
  }, [activeDashboard]);

  function moveWidget(id: string, direction: "up" | "down") {
    if (isGridLocked) return;

    setWidgetOrder((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const next = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }

  function resizeWidget(id: string, axis: "width" | "height", delta: -1 | 1) {
    if (isGridLocked) return;

    setWidgetSizes((prev) => {
      const current = prev[id];
      if (!current) return prev;

      const next: WidgetSize =
        axis === "width"
          ? {
              ...current,
              colSpan: Math.max(MIN_COL_SPAN, Math.min(MAX_COL_SPAN, current.colSpan + delta))
            }
          : {
              ...current,
              rowSpan: Math.max(MIN_ROW_SPAN, Math.min(MAX_ROW_SPAN, current.rowSpan + delta))
            };

      return { ...prev, [id]: next };
    });
  }

  function onDropOnWidget(targetId: string) {
    if (isGridLocked) return;
    if (!draggedWidgetId || draggedWidgetId === targetId) return;
    setWidgetOrder((prev) => {
      const sourceIndex = prev.indexOf(draggedWidgetId);
      const targetIndex = prev.indexOf(targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedWidgetId(null);
  }

  const widgetById = new Map(visibleWidgets.map((widget) => [widget.id, widget]));
  const classicDashboardContent = (
    <section className="dashboard-grid">
      {widgetOrder.map((widgetId) => {
        const widget = widgetById.get(widgetId);
        if (!widget) return null;
        const size = widgetSizes[widget.id] ?? widget.defaultSize;

        return (
          <article
            key={widget.id}
            className="widget-shell"
            style={{
              gridColumn: `span ${size.colSpan}`,
              gridRow: `span ${size.rowSpan}`
            }}
            onDragOver={(event) => {
              if (!isGridLocked) event.preventDefault();
            }}
            onDrop={() => onDropOnWidget(widget.id)}
          >
            <div className="widget-toolbar">
              <strong>{widget.title}</strong>
              <div className="widget-actions">
                <button
                  type="button"
                  className="widget-btn"
                  draggable={!isGridLocked}
                  onDragStart={() => setDraggedWidgetId(widget.id)}
                  onDragEnd={() => setDraggedWidgetId(null)}
                  title="Drag to move"
                  disabled={isGridLocked}
                >
                  Drag
                </button>
                <button
                  type="button"
                  className="widget-btn"
                  onClick={() => moveWidget(widget.id, "up")}
                  disabled={isGridLocked}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="widget-btn"
                  onClick={() => moveWidget(widget.id, "down")}
                  disabled={isGridLocked}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="widget-btn"
                  onClick={() => resizeWidget(widget.id, "width", -1)}
                  disabled={isGridLocked}
                >
                  W-
                </button>
                <button
                  type="button"
                  className="widget-btn"
                  onClick={() => resizeWidget(widget.id, "width", 1)}
                  disabled={isGridLocked}
                >
                  W+
                </button>
                <button
                  type="button"
                  className="widget-btn"
                  onClick={() => resizeWidget(widget.id, "height", -1)}
                  disabled={isGridLocked}
                >
                  H-
                </button>
                <button
                  type="button"
                  className="widget-btn"
                  onClick={() => resizeWidget(widget.id, "height", 1)}
                  disabled={isGridLocked}
                >
                  H+
                </button>
              </div>
            </div>
            <div className="widget-body">{widget.content}</div>
          </article>
        );
      })}
    </section>
  );

  if (!auth) {
    return (
      <main className="auth-shell">
        <header className="auth-topbar">
          <div className="auth-brand">
            <span className="auth-brand-logo" aria-hidden="true">
              <span className="auth-brand-logo-shine" />
              <span className="auth-brand-logo-core">IA</span>
            </span>
            <span className="auth-brand-text-wrap">
              <span className="auth-brand-text">InvestAI</span>
              <span className="auth-brand-subtext">SAR Intelligence Suite</span>
            </span>
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
    <main className="shell dashboard-shell">
      <HeaderBar
        isGridLocked={isGridLocked}
        onToggleGridLock={() => setIsGridLocked((prev) => !prev)}
        activeDashboard={activeDashboard}
        onSwitchDashboard={setActiveDashboard}
      />
      <div className="dashboard-content-shell">
        <LifeMobileDashboard
          activeDashboard={activeDashboard}
          onOpenMainDashboard={() => setActiveDashboard("life")}
          onOpenOtherDashboard={() => setActiveDashboard("classic")}
          onOpenChatbotDashboard={() => setActiveDashboard("chatbot")}
          onOpenSettleDashboard={() => setActiveDashboard("settle")}
          timeSeriesContent={timeSeriesPanel}
          activeTimeSeriesScenario={activeTimeSeriesScenario}
          timeSeriesSnapshot={timeSeriesState.snapshot}
          timeSeriesLoading={timeSeriesState.isLoading}
          centerContent={classicDashboardContent}
          chatbotContent={<RecipeChatbotDashboard />}
          settleContent={
            isSettleExpenseOpen ? (
              <AddExpensePage onBack={() => setIsSettleExpenseOpen(false)} />
            ) : (
              <GroupExpenseDashboard onAddExpense={() => setIsSettleExpenseOpen(true)} />
            )
          }
        />
      </div>
    </main>
  );
}
