import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from time_series.finance import (
    credit_card_utilization_forecast,
    detect_anomalies,
    expense_forecast,
    normalize_series,
    spending_patterns,
    trip_budget_projection,
)


class TimeSeriesFinanceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.series = normalize_series(
            [
                {"date": "2026-03-01", "amount": 100, "category": "Food"},
                {"date": "2026-03-02", "amount": 120, "category": "Food"},
                {"date": "2026-03-03", "amount": 130, "category": "Bills"},
                {"date": "2026-03-04", "amount": 150, "category": "Travel"},
            ]
        )

    def test_expense_forecast_returns_trend_and_budget_status(self) -> None:
        result = expense_forecast(self.series, periods=2, budget_limit=200)

        self.assertEqual(result["trend"], "increasing")
        self.assertFalse(result["budgetExceeded"])
        self.assertEqual(len(result["forecast"]), 2)

    def test_spending_patterns_returns_top_category(self) -> None:
        result = spending_patterns(self.series)

        self.assertEqual(result["topCategory"]["category"], "Food")

    def test_anomaly_detection_flags_outlier(self) -> None:
        series = normalize_series(
            [
                {"date": "2026-03-01", "amount": 100, "category": "Food"},
                {"date": "2026-03-02", "amount": 110, "category": "Food"},
                {"date": "2026-03-03", "amount": 115, "category": "Bills"},
                {"date": "2026-03-04", "amount": 400, "category": "Travel"},
            ]
        )

        result = detect_anomalies(series, z_score_threshold=1.5)

        self.assertEqual(len(result["alerts"]), 1)
        self.assertEqual(result["alerts"][0]["amount"], 400.0)

    def test_credit_card_utilization_forecast_assigns_high_risk(self) -> None:
        result = credit_card_utilization_forecast(self.series, limit_amount=300, current_balance=120)

        self.assertEqual(result["risk"], "HIGH")

    def test_trip_budget_projection_marks_over_budget(self) -> None:
        result = trip_budget_projection(self.series, trip_days=5, total_budget=600)

        self.assertTrue(result["overBudget"])


if __name__ == "__main__":
    unittest.main()
