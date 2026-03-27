import type { ReactNode } from "react";
import { CURRENCY_PREFIX } from "../lib/currency";
import type { ScenarioDefinition, TimeSeriesSnapshot } from "../lib/timeSeriesShowcase";
import { useAuth } from "../state/AuthContext";

interface LifeMobileDashboardProps {
  onOpenOtherDashboard: () => void;
  onOpenMainDashboard: () => void;
  onOpenChatbotDashboard: () => void;
  onOpenSettleDashboard: () => void;
  activeDashboard: "classic" | "life" | "chatbot" | "settle";
  centerContent?: ReactNode;
  chatbotContent?: ReactNode;
  settleContent?: ReactNode;
  timeSeriesContent?: ReactNode;
  activeTimeSeriesScenario: ScenarioDefinition;
  timeSeriesSnapshot: TimeSeriesSnapshot | null;
  timeSeriesLoading: boolean;
}

function formatCurrency(amount: number) {
  return `${CURRENCY_PREFIX}${amount.toFixed(0)}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function toDisplayName(email?: string) {
  if (!email) return "User";
  const localPart = email.split("@")[0] || "User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function LifeMobileDashboard({
  onOpenOtherDashboard,
  onOpenMainDashboard,
  onOpenChatbotDashboard,
  onOpenSettleDashboard,
  activeDashboard,
  centerContent,
  chatbotContent,
  settleContent,
  timeSeriesContent,
  activeTimeSeriesScenario,
  timeSeriesSnapshot,
  timeSeriesLoading
}: LifeMobileDashboardProps) {
  const { auth, logout } = useAuth();
  const displayName = toDisplayName(auth?.email);
  const totalSpent = activeTimeSeriesScenario.series.reduce((sum, point) => sum + point.amount, 0);
  const averageSpend = totalSpent / activeTimeSeriesScenario.series.length;
  const budgetLimit = activeTimeSeriesScenario.budgetLimit;
  const projectedExpense = timeSeriesSnapshot?.forecast.predictedExpense ?? averageSpend;
  const balanceAmount = Math.max(0, budgetLimit * 3 - projectedExpense - activeTimeSeriesScenario.currentBalance);
  const investmentAmount = Math.max(0, totalSpent * 1.8);
  const goalProgress = Math.min(
    100,
    Math.round((projectedExpense / Math.max(activeTimeSeriesScenario.tripBudget, budgetLimit)) * 100)
  );
  const anomalyCount = timeSeriesSnapshot?.anomalies.alerts.length ?? 0;
  const monthlyBars = activeTimeSeriesScenario.series.map((point) =>
    Math.max(22, Math.min(100, Math.round((point.amount / Math.max(...activeTimeSeriesScenario.series.map((item) => item.amount))) * 100)))
  );
  const categoryTotals = activeTimeSeriesScenario.series.reduce<Record<string, number>>((acc, point) => {
    const category = point.category ?? "General";
    acc[category] = (acc[category] ?? 0) + point.amount;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryTotals)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount: formatCurrency(amount) }));
  const statCards = [
    {
      title: "Account Balance",
      value: formatCurrency(balanceAmount),
      trend: `${activeTimeSeriesScenario.label} reserve after projected spend`,
      tone: "violet"
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(totalSpent),
      trend: `${timeSeriesSnapshot?.forecast.trend ?? "stable"} trend across ${activeTimeSeriesScenario.series.length} days`,
      tone: "rose"
    },
    {
      title: "Total Investment",
      value: formatCurrency(investmentAmount),
      trend: `${formatPercent((investmentAmount / Math.max(totalSpent, 1)) * 10)} growth proxy from active scenario`,
      tone: "blue"
    },
    {
      title: "Goal Progress",
      value: formatPercent(goalProgress),
      trend: `${activeTimeSeriesScenario.label} target is ${formatCurrency(activeTimeSeriesScenario.tripBudget)}`,
      tone: "gold"
    }
  ];
  const recentExpenses = activeTimeSeriesScenario.series
    .slice()
    .reverse()
    .map((point, index) => ({
      amount: formatCurrency(point.amount),
      category: point.category ?? "General",
      sub: activeTimeSeriesScenario.label,
      date: point.date,
      mode: index % 2 === 0 ? "Card" : "UPI"
    }));
  const subscriptions = [
    {
      name: `${activeTimeSeriesScenario.label} forecast`,
      date: timeSeriesSnapshot?.forecast.forecast[0]?.date ?? "Pending",
      amount: timeSeriesSnapshot ? formatCurrency(timeSeriesSnapshot.forecast.predictedExpense) : "--"
    },
    {
      name: "Credit card bill",
      date: `${Math.round((timeSeriesSnapshot?.credit.utilizationRate ?? 0) * 100)}% utilization`,
      amount: timeSeriesSnapshot ? formatCurrency(timeSeriesSnapshot.credit.expectedBill) : "--"
    },
    {
      name: "Trip budget projection",
      date: `${timeSeriesSnapshot?.trip.tripDays ?? activeTimeSeriesScenario.tripDays} day horizon`,
      amount: timeSeriesSnapshot ? formatCurrency(timeSeriesSnapshot.trip.projectedTotal) : "--"
    },
    {
      name: "Budget control",
      date: timeSeriesSnapshot?.forecast.budgetExceeded ? "Budget breach likely" : "Budget in range",
      amount: formatCurrency(activeTimeSeriesScenario.budgetLimit)
    }
  ];

  return (
    <section className="life-dashboard-shell">
      <div className="life-layout">
        <aside className="life-sidebar">
          <div className="life-brand">
            <span className="life-brand-mark">N</span>
            <strong>EXPENSIFY</strong>
          </div>
          <nav className="life-nav">
            <p>General</p>
            <button
              type="button"
              className={`life-nav-link-btn${activeDashboard === "life" ? " is-active" : ""}`}
              onClick={onOpenMainDashboard}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`life-nav-link-btn${activeDashboard === "classic" ? " is-active" : ""}`}
              onClick={onOpenOtherDashboard}
            >
              Investment Cockpit
            </button>
            <button
              type="button"
              className={`life-nav-link-btn${activeDashboard === "chatbot" ? " is-active" : ""}`}
              onClick={onOpenChatbotDashboard}
            >
              Recipe Chatbot
            </button>
            <button
              type="button"
              className={`life-nav-link-btn${activeDashboard === "settle" ? " is-active" : ""}`}
              onClick={onOpenSettleDashboard}
            >
              Settle up
            </button>
            <a href="#">All Expenses</a>
            <a href="#">Bill & Subscription</a>
            <a href="#">Investment</a>
            <a href="#">Goals</a>
            <p>Tools</p>
            <a href="#">Insight</a>
            <a href="#">Analytics</a>
            <a href="#">Recipe Chatbot</a>
            <p>Other</p>
            <a href="#">Setting</a>
            <a href="#">Help Center</a>
            <a href="#">Support</a>
            <button type="button" className="life-nav-link-btn life-logout-btn" onClick={logout}>
              Logout
            </button>
          </nav>
          <button type="button" className="life-pro-btn">
            Upgrade to Pro
          </button>
        </aside>

        <div className="life-main">
          {activeDashboard === "life" ? (
            <>
              <header className="life-topbar">
                <div>
                  <h2>Hi, {displayName}</h2>
                  <p>Track your expenses and transactions</p>
                </div>
                <div className="life-topbar-actions">
                  <input type="search" placeholder="Search expense, transaction, cards" />
                  <button type="button">+</button>
                </div>
              </header>

              <section className="life-stats-grid">
                {statCards.map((card) => (
                  <article key={card.title} className={`life-stat-card tone-${card.tone}`}>
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <small>{card.trend}</small>
                  </article>
                ))}
              </section>

              <section className="life-insight-grid">
                <article className="life-panel">
                  <header>
                    <h3>Monthly Expenses</h3>
                    <small>
                      {timeSeriesSnapshot
                        ? `${formatCurrency(projectedExpense)} next forecast, ${anomalyCount} anomalies flagged`
                        : "Loading active expense pattern"}
                    </small>
                  </header>
                  <div className="life-bars" aria-hidden="true">
                    {monthlyBars.map((height, index) => (
                      <span key={`${activeTimeSeriesScenario.id}-${index}`} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </article>

                <article className="life-panel">
                  <header>
                    <h3>Top Category</h3>
                    <small>{timeSeriesSnapshot?.patterns.topCategory?.category ?? activeTimeSeriesScenario.label}</small>
                  </header>
                  <div className="life-donut-row">
                    <div className="life-donut" aria-hidden="true" />
                    <ul>
                      {topCategories.map((item) => (
                        <li key={item.name}>
                          <span>{item.name}</span>
                          <strong>{item.amount}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </section>

              {timeSeriesContent ? <section className="life-timeseries-slot">{timeSeriesContent}</section> : null}

              <section className="life-bottom-grid">
                <article className="life-panel">
                  <header>
                    <h3>Recent Expenses</h3>
                    <small>{activeTimeSeriesScenario.label}</small>
                  </header>
                  <div className="life-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Category</th>
                          <th>Sub Category</th>
                          <th>Date</th>
                          <th>Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentExpenses.map((row) => (
                          <tr key={`${row.amount}-${row.date}`}>
                            <td>{row.amount}</td>
                            <td>{row.category}</td>
                            <td>{row.sub}</td>
                            <td>{row.date}</td>
                            <td>{row.mode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="life-panel life-subscriptions">
                  <header>
                    <h3>Bill, Credit & Trip Forecast</h3>
                    <small>{timeSeriesLoading ? "Refreshing from ML service" : activeTimeSeriesScenario.label}</small>
                  </header>
                  <ul>
                    {subscriptions.map((item) => (
                      <li key={item.name}>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.date}</small>
                        </div>
                        <span>{item.amount}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            </>
          ) : activeDashboard === "classic" ? (
            <section className="life-main-embedded">{centerContent}</section>
          ) : activeDashboard === "chatbot" ? (
            <section className="life-main-embedded">{chatbotContent}</section>
          ) : (
            <section className="life-main-embedded">{settleContent}</section>
          )}
        </div>
      </div>
    </section>
  );
}
