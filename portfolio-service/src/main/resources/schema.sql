CREATE SCHEMA IF NOT EXISTS invest_platform_ai;

CREATE TABLE IF NOT EXISTS invest_platform_ai.portfolios (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS invest_platform_ai.holdings (
  id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES invest_platform_ai.portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  quantity NUMERIC(18, 4) NOT NULL,
  avg_price NUMERIC(18, 4) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS invest_platform_ai.trades (
  id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES invest_platform_ai.portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  trade_type VARCHAR(10) NOT NULL,
  quantity NUMERIC(18, 4) NOT NULL,
  price NUMERIC(18, 4) NOT NULL,
  trade_time TIMESTAMP NOT NULL
);
