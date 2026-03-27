from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from math import sqrt
from statistics import mean
from typing import Any, Dict, Iterable, List, Optional


@dataclass(frozen=True)
class TimeSeriesPoint:
    date_value: date
    amount: float
    category: Optional[str] = None


def normalize_series(points: Iterable[Dict[str, Any]]) -> List[TimeSeriesPoint]:
    normalized: List[TimeSeriesPoint] = []
    for point in points:
        normalized.append(
            TimeSeriesPoint(
                date_value=_parse_date(point["date"]),
                amount=float(point["amount"]),
                category=point.get("category"),
            )
        )
    normalized.sort(key=lambda item: item.date_value)
    if not normalized:
        raise ValueError("Time series must contain at least one point")
    return normalized


def expense_forecast(
    points: List[TimeSeriesPoint],
    periods: int = 1,
    budget_limit: Optional[float] = None,
) -> Dict[str, Any]:
    if periods < 1:
        raise ValueError("periods must be at least 1")

    predicted_values = _linear_forecast([point.amount for point in points], periods)
    predicted_expense = round(predicted_values[-1], 2)
    trend = _trend_label(points)
    response: Dict[str, Any] = {
        "predictedExpense": predicted_expense,
        "trend": trend,
        "forecast": [
            {
                "date": forecast_date.isoformat(),
                "amount": round(amount, 2),
            }
            for forecast_date, amount in zip(_forecast_dates(points, periods), predicted_values)
        ],
    }
    if budget_limit is not None:
        response["budgetLimit"] = round(float(budget_limit), 2)
        response["budgetExceeded"] = predicted_expense > float(budget_limit)
    return response


def spending_patterns(points: List[TimeSeriesPoint]) -> Dict[str, Any]:
    weekday_amounts = [point.amount for point in points if point.date_value.weekday() < 5]
    weekend_amounts = [point.amount for point in points if point.date_value.weekday() >= 5]
    salary_week_amounts = [point.amount for point in points if point.date_value.day <= 7]
    other_days_amounts = [point.amount for point in points if point.date_value.day > 7]

    insights: List[str] = []
    weekend_ratio = _relative_delta(weekend_amounts, weekday_amounts)
    salary_week_ratio = _relative_delta(salary_week_amounts, other_days_amounts)

    if weekend_ratio is not None and abs(weekend_ratio) >= 0.1:
        direction = "more" if weekend_ratio > 0 else "less"
        insights.append(f"You spend {abs(round(weekend_ratio * 100, 1))}% {direction} on weekends")

    if salary_week_ratio is not None and salary_week_ratio >= 0.1:
        insights.append(f"Spending spikes by {round(salary_week_ratio * 100, 1)}% during salary week")

    category_totals: Dict[str, float] = defaultdict(float)
    for point in points:
        if point.category:
            category_totals[point.category] += point.amount

    top_category = None
    if category_totals:
        top_name, top_amount = max(category_totals.items(), key=lambda item: item[1])
        top_category = {"category": top_name, "amount": round(top_amount, 2)}

    return {
        "insights": insights,
        "weekendDelta": None if weekend_ratio is None else round(weekend_ratio, 4),
        "salaryWeekDelta": None if salary_week_ratio is None else round(salary_week_ratio, 4),
        "topCategory": top_category,
    }


def detect_anomalies(points: List[TimeSeriesPoint], z_score_threshold: float = 2.0) -> Dict[str, Any]:
    if z_score_threshold <= 0:
        raise ValueError("zScoreThreshold must be positive")

    amounts = [point.amount for point in points]
    avg = mean(amounts)
    variance = mean([(amount - avg) ** 2 for amount in amounts]) if len(amounts) > 1 else 0.0
    std_dev = sqrt(variance)

    alerts = []
    if std_dev == 0:
        return {"alerts": alerts, "baseline": round(avg, 2), "threshold": z_score_threshold}

    for point in points:
        z_score = (point.amount - avg) / std_dev
        if abs(z_score) >= z_score_threshold:
            alerts.append(
                {
                    "alert": "Unusual expense detected",
                    "date": point.date_value.isoformat(),
                    "amount": round(point.amount, 2),
                    "expected": round(avg, 2),
                    "zScore": round(z_score, 2),
                    "category": point.category,
                }
            )

    return {
        "alerts": alerts,
        "baseline": round(avg, 2),
        "threshold": z_score_threshold,
    }


def credit_card_utilization_forecast(
    points: List[TimeSeriesPoint],
    limit_amount: float,
    current_balance: float = 0.0,
) -> Dict[str, Any]:
    if limit_amount <= 0:
        raise ValueError("limitAmount must be positive")
    if current_balance < 0:
        raise ValueError("currentBalance cannot be negative")

    forecast = expense_forecast(points, periods=1)
    expected_bill = round(current_balance + forecast["predictedExpense"], 2)
    utilization = expected_bill / float(limit_amount)

    if utilization >= 0.9:
        risk = "HIGH"
    elif utilization >= 0.7:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "expectedBill": expected_bill,
        "risk": risk,
        "utilizationRate": round(utilization, 4),
        "creditLimit": round(float(limit_amount), 2),
    }


def trip_budget_projection(
    points: List[TimeSeriesPoint],
    trip_days: int,
    total_budget: Optional[float] = None,
) -> Dict[str, Any]:
    if trip_days < 1:
        raise ValueError("tripDays must be at least 1")

    average_daily_spend = mean([point.amount for point in points])
    projected_total = round(average_daily_spend * trip_days, 2)
    response: Dict[str, Any] = {
        "projectedTotal": projected_total,
        "averageDailySpend": round(average_daily_spend, 2),
        "tripDays": trip_days,
        "trend": _trend_label(points),
    }
    if total_budget is not None:
        response["budget"] = round(float(total_budget), 2)
        response["overBudget"] = projected_total > float(total_budget)
    return response


def _parse_date(raw_value: str) -> date:
    try:
        return datetime.strptime(raw_value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"Invalid date '{raw_value}', expected YYYY-MM-DD") from exc


def _linear_forecast(values: List[float], periods: int) -> List[float]:
    if len(values) == 1:
        return [round(values[0], 2) for _ in range(periods)]

    x_values = list(range(len(values)))
    n = len(values)
    sum_x = sum(x_values)
    sum_y = sum(values)
    sum_xy = sum(x * y for x, y in zip(x_values, values))
    sum_x2 = sum(x * x for x in x_values)
    denominator = (n * sum_x2) - (sum_x * sum_x)
    if denominator == 0:
        return [round(values[-1], 2) for _ in range(periods)]

    beta = ((n * sum_xy) - (sum_x * sum_y)) / denominator
    alpha = (sum_y - beta * sum_x) / n
    return [round(alpha + beta * (len(values) + offset), 2) for offset in range(periods)]


def _trend_label(points: List[TimeSeriesPoint]) -> str:
    values = [point.amount for point in points]
    if len(values) < 2:
        return "stable"

    slope = _linear_forecast(values, 1)[0] - values[-1]
    if slope > 1:
        return "increasing"
    if slope < -1:
        return "decreasing"
    return "stable"


def _forecast_dates(points: List[TimeSeriesPoint], periods: int) -> List[date]:
    if len(points) == 1:
        step = 1
    else:
        gaps = [
            (points[index].date_value - points[index - 1].date_value).days
            for index in range(1, len(points))
        ]
        positive_gaps = [gap for gap in gaps if gap > 0]
        step = max(1, round(mean(positive_gaps))) if positive_gaps else 1

    last_date = points[-1].date_value
    return [last_date + timedelta(days=step * (offset + 1)) for offset in range(periods)]


def _relative_delta(left: List[float], right: List[float]) -> Optional[float]:
    if not left or not right:
        return None
    right_avg = mean(right)
    if right_avg == 0:
        return None
    return (mean(left) - right_avg) / right_avg
