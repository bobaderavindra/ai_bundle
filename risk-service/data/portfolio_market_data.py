import os
from typing import List

import psycopg2


def _db_config() -> dict:
    return {
        "host": os.getenv("RISK_DB_HOST", "localhost"),
        "port": int(os.getenv("RISK_DB_PORT", "5432")),
        "dbname": os.getenv("RISK_DB_NAME", "investai_auth"),
        "user": os.getenv("RISK_DB_USERNAME", "investai"),
        "password": os.getenv("RISK_DB_PASSWORD", "investai"),
    }


def fetch_trade_prices(portfolio_id: str) -> List[float]:
    query = """
        SELECT price
        FROM invest_platform_ai.trades
        WHERE portfolio_id = %s
        ORDER BY trade_time ASC
    """
    with psycopg2.connect(**_db_config()) as conn:
        with conn.cursor() as cur:
            cur.execute(query, (portfolio_id,))
            rows = cur.fetchall()
    return [float(row[0]) for row in rows]
