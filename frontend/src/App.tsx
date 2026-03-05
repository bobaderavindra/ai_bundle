import { useEffect, useMemo, useState } from "react";
import HeaderBar from "./components/HeaderBar";
import LoginPanel from "./components/LoginPanel";
import StockTicker from "./components/StockTicker";
import CandleChart from "./components/CandleChart";
import AllocationChart from "./components/AllocationChart";
import StrategyBuilder from "./components/StrategyBuilder";
import TradePanel from "./components/TradePanel";
import AdminPanel from "./components/AdminPanel";
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

  const widgetDefs = useMemo<WidgetDef[]>(
    () => [
      {
        id: "live-prices",
        title: "Live Prices",
        content: <StockTicker />,
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
        content: <CandleChart />,
        defaultSize: { colSpan: 8, rowSpan: 2 }
      },
      {
        id: "portfolio-allocation",
        title: "Portfolio Allocation",
        content: <AllocationChart />,
        defaultSize: { colSpan: 4, rowSpan: 2 }
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
    []
  );

  const visibleWidgets = useMemo(
    () => widgetDefs.filter((widget) => !widget.adminOnly || auth.role === "ADMIN"),
    [auth.role, widgetDefs]
  );

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => visibleWidgets.map((widget) => widget.id));
  const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>(() =>
    Object.fromEntries(visibleWidgets.map((widget) => [widget.id, widget.defaultSize]))
  );
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

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

  function moveWidget(id: string, direction: "up" | "down") {
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

  return (
    <main className="shell dashboard-shell">
      <HeaderBar />
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
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropOnWidget(widget.id)}
            >
              <div className="widget-toolbar">
                <strong>{widget.title}</strong>
                <div className="widget-actions">
                  <button
                    type="button"
                    className="widget-btn"
                    draggable
                    onDragStart={() => setDraggedWidgetId(widget.id)}
                    onDragEnd={() => setDraggedWidgetId(null)}
                    title="Drag to move"
                  >
                    Drag
                  </button>
                  <button type="button" className="widget-btn" onClick={() => moveWidget(widget.id, "up")}>
                    Up
                  </button>
                  <button type="button" className="widget-btn" onClick={() => moveWidget(widget.id, "down")}>
                    Down
                  </button>
                  <button type="button" className="widget-btn" onClick={() => resizeWidget(widget.id, "width", -1)}>
                    W-
                  </button>
                  <button type="button" className="widget-btn" onClick={() => resizeWidget(widget.id, "width", 1)}>
                    W+
                  </button>
                  <button type="button" className="widget-btn" onClick={() => resizeWidget(widget.id, "height", -1)}>
                    H-
                  </button>
                  <button type="button" className="widget-btn" onClick={() => resizeWidget(widget.id, "height", 1)}>
                    H+
                  </button>
                </div>
              </div>
              <div className="widget-body">{widget.content}</div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
