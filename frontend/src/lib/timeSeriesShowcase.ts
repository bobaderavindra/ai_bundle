export type ScenarioId = "monthly-expenses" | "credit-usage" | "trip-spend";

export interface TimeSeriesPoint {
  date: string;
  amount: number;
  category?: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  description: string;
  budgetLimit: number;
  creditLimit: number;
  currentBalance: number;
  tripDays: number;
  tripBudget: number;
  series: TimeSeriesPoint[];
}

export interface ForecastResponse {
  predictedExpense: number;
  trend: string;
  budgetLimit?: number;
  budgetExceeded?: boolean;
  forecast: Array<{ date: string; amount: number }>;
}

export interface PatternResponse {
  insights: string[];
  weekendDelta: number | null;
  salaryWeekDelta: number | null;
  topCategory: { category: string; amount: number } | null;
}

export interface AnomalyResponse {
  alerts: Array<{
    alert: string;
    date: string;
    amount: number;
    expected: number;
    zScore: number;
    category?: string | null;
  }>;
  baseline: number;
  threshold: number;
}

export interface CreditResponse {
  expectedBill: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  utilizationRate: number;
  creditLimit: number;
}

export interface TripResponse {
  projectedTotal: number;
  averageDailySpend: number;
  tripDays: number;
  trend: string;
  budget?: number;
  overBudget?: boolean;
}

export interface TimeSeriesSnapshot {
  forecast: ForecastResponse;
  patterns: PatternResponse;
  anomalies: AnomalyResponse;
  credit: CreditResponse;
  trip: TripResponse;
}

export const TIME_SERIES_SCENARIOS: ScenarioDefinition[] = [
  {
    id: "monthly-expenses",
    label: "Daily Expenses",
    description: "Track monthly spend drift, weekend spikes, and budget pressure.",
    budgetLimit: 420,
    creditLimit: 1200,
    currentBalance: 310,
    tripDays: 4,
    tripBudget: 540,
    series: [
      { date: "2026-03-01", amount: 120, category: "Food" },
      { date: "2026-03-02", amount: 145, category: "Bills" },
      { date: "2026-03-03", amount: 160, category: "Food" },
      { date: "2026-03-04", amount: 172, category: "Shopping" },
      { date: "2026-03-05", amount: 190, category: "Travel" },
      { date: "2026-03-06", amount: 205, category: "Food" },
      { date: "2026-03-07", amount: 298, category: "Shopping" }
    ]
  },
  {
    id: "credit-usage",
    label: "Credit Card",
    description: "Estimate the next bill and flag over-limit behavior early.",
    budgetLimit: 700,
    creditLimit: 1500,
    currentBalance: 820,
    tripDays: 5,
    tripBudget: 780,
    series: [
      { date: "2026-03-01", amount: 180, category: "Dining" },
      { date: "2026-03-02", amount: 240, category: "Fuel" },
      { date: "2026-03-03", amount: 260, category: "Bills" },
      { date: "2026-03-04", amount: 320, category: "Shopping" },
      { date: "2026-03-05", amount: 340, category: "Travel" },
      { date: "2026-03-06", amount: 390, category: "Electronics" }
    ]
  },
  {
    id: "trip-spend",
    label: "Trip Budget",
    description: "Project end-of-trip cost from live daily spending.",
    budgetLimit: 500,
    creditLimit: 1800,
    currentBalance: 260,
    tripDays: 7,
    tripBudget: 1100,
    series: [
      { date: "2026-03-01", amount: 140, category: "Flights" },
      { date: "2026-03-02", amount: 220, category: "Stay" },
      { date: "2026-03-03", amount: 165, category: "Food" },
      { date: "2026-03-04", amount: 210, category: "Transport" },
      { date: "2026-03-05", amount: 195, category: "Food" },
      { date: "2026-03-06", amount: 420, category: "Activities" }
    ]
  }
];

export function getTimeSeriesScenario(id: ScenarioId): ScenarioDefinition {
  return TIME_SERIES_SCENARIOS.find((scenario) => scenario.id === id) ?? TIME_SERIES_SCENARIOS[0];
}
