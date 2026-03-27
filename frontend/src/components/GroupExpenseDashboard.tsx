import { BASE_CURRENCY, CURRENCY_PREFIX } from "../lib/currency";

const headlineMetrics = [
  { label: "Total group spend", value: `${CURRENCY_PREFIX}18,420`, trend: "+12% vs last month", tone: "primary" },
  { label: "Open balances", value: `${CURRENCY_PREFIX}3,145`, trend: "6 people owe", tone: "alert" },
  { label: "Settlements suggested", value: "4 transfers", trend: "Minimized", tone: "accent" },
  { label: "Base currency", value: BASE_CURRENCY, trend: "Live FX enabled", tone: "neutral" }
];

const contributionStats = [
  { name: "Avery", paid: `${CURRENCY_PREFIX}3,240`, share: "22%", status: "gets back" },
  { name: "Priya", paid: `${CURRENCY_PREFIX}2,880`, share: "18%", status: "gets back" },
  { name: "Jordan", paid: `${CURRENCY_PREFIX}2,410`, share: "15%", status: "owes" },
  { name: "Kai", paid: `${CURRENCY_PREFIX}1,980`, share: "13%", status: "owes" },
  { name: "Maya", paid: `${CURRENCY_PREFIX}1,760`, share: "11%", status: "owes" }
];

const splitTypes = [
  { title: "Equal", detail: "Split dinner or rent evenly across members." },
  { title: "Unequal", detail: "Custom amounts for different guests." },
  { title: "Percentage", detail: "Assign % based on budget or income." },
  { title: "Shares", detail: "Weighted splits for multi-day trips." },
  { title: "Multi-payer", detail: "Multiple people covered one receipt." }
];

const settlementPlan = [
  { from: "Jordan", to: "Avery", amount: `${CURRENCY_PREFIX}410` },
  { from: "Kai", to: "Priya", amount: `${CURRENCY_PREFIX}320` },
  { from: "Maya", to: "Avery", amount: `${CURRENCY_PREFIX}190` },
  { from: "Jordan", to: "Priya", amount: `${CURRENCY_PREFIX}85` }
];

const featureHighlights = [
  { title: "User management", detail: "Email, OAuth, avatar, currency preferences." },
  { title: "Group controls", detail: "Admins, members, viewers, invite links." },
  { title: "Smart settlement", detail: "Greedy matching to minimize transfers." },
  { title: "Multi-currency", detail: "Real-time FX rates per group." },
  { title: "Collaboration", detail: "Realtime updates, notifications, activity log." },
  { title: "Offline sync", detail: "Capture expenses offline, sync on reconnection." }
];

const insightCards = [
  { title: "Food", value: `${CURRENCY_PREFIX}5,120`, delta: "+8%", tone: "rose" },
  { title: "Travel", value: `${CURRENCY_PREFIX}4,880`, delta: "+3%", tone: "indigo" },
  { title: "Stay", value: `${CURRENCY_PREFIX}3,560`, delta: "-2%", tone: "emerald" },
  { title: "Misc", value: `${CURRENCY_PREFIX}1,930`, delta: "+5%", tone: "amber" }
];

const activityLog = [
  { action: "Avery added Hotel booking", meta: "Split 40/30/30", time: "2 hours ago" },
  { action: "Priya uploaded receipt", meta: "Airport transfer", time: "5 hours ago" },
  { action: "Jordan created BBQ group", meta: "5 members", time: "Yesterday" },
  { action: "Kai settled up with Priya", meta: `${CURRENCY_PREFIX}120`, time: "Yesterday" }
];

const securityChecklist = [
  "JWT-based authentication and refresh tokens.",
  "Row-level isolation per group.",
  "Encrypted receipts in object storage.",
  "Audit trail for edits and deletes."
];

interface GroupExpenseDashboardProps {
  onAddExpense?: () => void;
}

export default function GroupExpenseDashboard({ onAddExpense }: GroupExpenseDashboardProps) {
  return (
    <section className="settle-dashboard">
      <header className="settle-hero">
        <div>
          <p className="settle-kicker">Settle up workspace</p>
          <h2>Group Expense Sharing</h2>
          <p className="settle-subtitle">
            Track shared costs, calculate balances, and settle up in a single flow designed for trips, roommates, and
            teams.
          </p>
          <div className="settle-actions">
            <button type="button" onClick={onAddExpense}>
              Add expense
            </button>
            <button type="button" className="ghost">
              Create group
            </button>
            <button type="button" className="ghost">
              Invite link
            </button>
          </div>
        </div>
        <div className="settle-hero-card">
          <h3>Smart settlement engine</h3>
          <p>Balances converted to net values and matched to minimize transfers.</p>
          <div className="settle-engine">
            <div>
              <span>Net balance</span>
              <strong className="tone-positive">{CURRENCY_PREFIX}720</strong>
            </div>
            <div>
              <span>Transfers needed</span>
              <strong>4</strong>
            </div>
            <div>
              <span>Largest debtor</span>
              <strong className="tone-negative">{CURRENCY_PREFIX}410</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="settle-metrics">
        {headlineMetrics.map((metric) => (
          <article key={metric.label} className={`settle-metric tone-${metric.tone}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.trend}</small>
          </article>
        ))}
      </section>

      <section className="settle-grid">
        <article className="settle-panel settle-panel-wide">
          <header>
            <h3>Contribution overview</h3>
            <small>Updated in real time</small>
          </header>
          <div className="settle-table">
            <div className="settle-table-head">
              <span>Member</span>
              <span>Paid</span>
              <span>Share</span>
              <span>Status</span>
            </div>
            {contributionStats.map((row) => (
              <div key={row.name} className="settle-table-row">
                <strong>{row.name}</strong>
                <span>{row.paid}</span>
                <span>{row.share}</span>
                <span className={row.status === "owes" ? "tone-negative" : "tone-positive"}>{row.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="settle-panel">
          <header>
            <h3>Split types</h3>
            <small>Supports complex scenarios</small>
          </header>
          <ul className="settle-splits">
            {splitTypes.map((split) => (
              <li key={split.title}>
                <strong>{split.title}</strong>
                <span>{split.detail}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="settle-grid">
        <article className="settle-panel">
          <header>
            <h3>Settlement plan</h3>
            <small>Minimum transfers</small>
          </header>
          <div className="settle-transfer-list">
            {settlementPlan.map((item, index) => (
              <div key={`${item.from}-${item.to}-${index}`} className="settle-transfer-row">
                <span>{item.from}</span>
                <span className="settle-transfer-arrow">pays</span>
                <span>{item.to}</span>
                <strong>{item.amount}</strong>
              </div>
            ))}
          </div>
          <button type="button" className="settle-primary-btn">
            One-click settle up
          </button>
        </article>

        <article className="settle-panel">
          <header>
            <h3>Insights</h3>
            <small>Category breakdown</small>
          </header>
          <div className="settle-insights">
            {insightCards.map((card) => (
              <div key={card.title} className={`settle-insight tone-${card.tone}`}>
                <span>{card.title}</span>
                <strong>{card.value}</strong>
                <small>{card.delta}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="settle-panel">
          <header>
            <h3>Realtime collaboration</h3>
            <small>WebSockets and notifications</small>
          </header>
          <ul className="settle-activity">
            {activityLog.map((item) => (
              <li key={item.action}>
                <strong>{item.action}</strong>
                <span>{item.meta}</span>
                <small>{item.time}</small>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="settle-grid settle-grid-bottom">
        <article className="settle-panel settle-panel-wide">
          <header>
            <h3>Feature map</h3>
            <small>Security and scalability ready</small>
          </header>
          <div className="settle-feature-grid">
            {featureHighlights.map((feature) => (
              <div key={feature.title} className="settle-feature-card">
                <strong>{feature.title}</strong>
                <span>{feature.detail}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="settle-panel">
          <header>
            <h3>Security checklist</h3>
            <small>Defense in depth</small>
          </header>
          <ul className="settle-security">
            {securityChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="settle-export">
            <button type="button" className="ghost">
              Export CSV
            </button>
            <button type="button" className="ghost">
              Download summary
            </button>
          </div>
        </article>
      </section>
    </section>
  );
}
