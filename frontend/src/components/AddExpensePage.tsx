interface AddExpensePageProps {
  onBack?: () => void;
}

import { CURRENCY_PREFIX } from "../lib/currency";

const memberBubbles = [
  { name: "Shailesh S", amount: `${CURRENCY_PREFIX}0.00` },
  { name: "Swapnil", amount: `${CURRENCY_PREFIX}0.00` },
  { name: "Milind", amount: `${CURRENCY_PREFIX}0.00`, note: "should pay" },
  { name: "Ravindra Bobade", amount: `${CURRENCY_PREFIX}0.00` }
];

const tabItems = ["Transactions", "Debts", "Members", "Permissions", "Recent activity"];

export default function AddExpensePage({ onBack }: AddExpensePageProps) {
  return (
    <section className="settleup-page">
      <header className="settleup-topbar">
        <div className="settleup-brand">
          <span className="settleup-brand-mark">S</span>
          <strong>Settle Up</strong>
        </div>
        <div className="settleup-actions">
          <button type="button" className="ghost">
            Go Premium
          </button>
          <div className="settleup-user">
            <div>
              <strong>Ravindra Bobade</strong>
              <span>bobaderavindra@gmail.com</span>
            </div>
            <span className="settleup-avatar">RB</span>
          </div>
          <button type="button" className="settleup-back-btn" onClick={onBack}>
            Back to dashboard
          </button>
        </div>
      </header>

      <section className="settleup-hero">
        <div className="settleup-bubbles">
          {memberBubbles.map((member) => (
            <div key={member.name} className="settleup-bubble">
              <strong>{member.name}</strong>
              <span>{member.amount}</span>
              {member.note && <small>{member.note}</small>}
            </div>
          ))}
        </div>

        <div className="settleup-summary">
          <h2>2026 Expenses</h2>
          <div className="settleup-summary-meta">
            <p>Transactions: 0</p>
            <p>Members: 4</p>
            <p>Total spent: {CURRENCY_PREFIX}0</p>
          </div>
          <strong>Anyone can pay</strong>
          <div className="settleup-summary-actions">
            <button type="button" className="ghost">
              Show charts
            </button>
            <button type="button" className="ghost">
              More
            </button>
          </div>
        </div>
      </section>

      <nav className="settleup-tabs">
        {tabItems.map((item, index) => (
          <button key={item} type="button" className={`settleup-tab${index === 0 ? " is-active" : ""}`}>
            {item}
          </button>
        ))}
      </nav>

      <section className="settleup-empty-card">
        <div>
          <strong>No transactions yet</strong>
          <p>Your friends can join the group when they click the link or scan the group QR code.</p>
        </div>
        <div className="settleup-empty-actions">
          <button type="button" className="ghost">
            Show QR code
          </button>
          <button type="button" className="ghost">
            Share group
          </button>
        </div>
      </section>

      <button type="button" className="settleup-fab">
        + Add transaction
      </button>
    </section>
  );
}
