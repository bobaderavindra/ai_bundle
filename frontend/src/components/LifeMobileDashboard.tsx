import type { ReactNode } from "react";
import { useAuth } from "../state/AuthContext";

const statCards = [
  { title: "Account Balance", value: "₹8,98,450", trend: "+6% vs last month", tone: "violet" },
  { title: "Monthly Expenses", value: "₹24,093", trend: "-2% vs last month", tone: "rose" },
  { title: "Total Investment", value: "₹1,45,555", trend: "+4.5% growth", tone: "blue" },
  { title: "Goal Progress", value: "60%", trend: "iPhone fund on track", tone: "gold" }
];

const topCategories = [
  { name: "Food & Grocery", amount: "₹6,156" },
  { name: "Investment", amount: "₹5,000" },
  { name: "Shopping", amount: "₹4,356" },
  { name: "Travelling", amount: "₹3,670" },
  { name: "Bills", amount: "₹2,749" }
];

const recentExpenses = [
  { amount: "₹2,100", category: "Shopping", sub: "Amazon", date: "31 May 2025", mode: "UPI" },
  { amount: "₹299", category: "Movies", sub: "PVR", date: "28 May 2025", mode: "UPI" },
  { amount: "₹5,000", category: "Investment", sub: "Grow", date: "24 May 2025", mode: "Bank" },
  { amount: "₹2,460", category: "Travel", sub: "IRCTC", date: "20 May 2025", mode: "Card" },
  { amount: "₹678", category: "Food", sub: "Swiggy", date: "15 May 2025", mode: "UPI" }
];

const subscriptions = [
  { name: "Netflix", date: "1 Jun 2025", amount: "₹149" },
  { name: "Spotify", date: "4 Aug 2025", amount: "₹49" },
  { name: "Figma", date: "6 Jun 2025", amount: "₹399" },
  { name: "WiFi", date: "21 Jun 2025", amount: "₹999" },
  { name: "Electricity", date: "31 Jun 2025", amount: "₹1,265" }
];

interface LifeMobileDashboardProps {
  onOpenOtherDashboard: () => void;
  onOpenMainDashboard: () => void;
  activeDashboard: "classic" | "life";
  centerContent?: ReactNode;
}

export default function LifeMobileDashboard({
  onOpenOtherDashboard,
  onOpenMainDashboard,
  activeDashboard,
  centerContent
}: LifeMobileDashboardProps) {
  const { logout } = useAuth();

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
            <a href="#">All Expenses</a>
            <a href="#">Bill & Subscription</a>
            <a href="#">Investment</a>
            <a href="#">Goals</a>
            <p>Tools</p>
            <a href="#">Insight</a>
            <a href="#">Analytics</a>
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
                  <h2>Hi, Ananya</h2>
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
                    <small>6% more than last month</small>
                  </header>
                  <div className="life-bars" aria-hidden="true">
                    <span style={{ height: "46%" }} />
                    <span style={{ height: "74%" }} />
                    <span style={{ height: "30%" }} />
                    <span style={{ height: "52%" }} />
                    <span style={{ height: "71%" }} />
                    <span style={{ height: "63%" }} />
                  </div>
                </article>

                <article className="life-panel">
                  <header>
                    <h3>Top Category</h3>
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

              <section className="life-bottom-grid">
                <article className="life-panel">
                  <header>
                    <h3>Recent Expenses</h3>
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
                    <h3>Bill & Subscription</h3>
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
          ) : (
            <section className="life-main-embedded">{centerContent}</section>
          )}
        </div>
      </div>
    </section>
  );
}
