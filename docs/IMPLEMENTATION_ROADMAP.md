# InvestAI Implementation Roadmap

This repository now includes a runnable baseline for:
- API gateway + auth + portfolio
- Risk engine
- Research RAG starter
- ML prediction starter
- Portfolio optimization engine

Use this roadmap to reach full interview-grade scope.

## Phase 1: Local-First Baseline (Done)
- Docker Compose orchestration for all services
- JWT auth through gateway
- Optimization service endpoints:
  - Mean-Variance (max Sharpe random-search optimizer)
  - Risk parity
  - Monte Carlo simulation
  - Rebalance suggestions
- Kubernetes manifests for each service

## Phase 2: Data + Persistence
- Add PostgreSQL for auth/portfolio state
- Add Redis for caching + token/session acceleration
- Add vector database (pgvector, Qdrant, or Pinecone) for research-service
- Add schema migrations with Flyway/Liquibase

## Phase 3: AI Market Prediction Engine
- Replace linear toy model with:
  - Multi-feature LSTM service
  - Transformer time-series model service
  - Sentiment + macro data ingestion job
- Expose unified inference output:
  - nextDayPrediction
  - confidenceScore
  - riskScore
- Add SHAP explanation endpoint

## Phase 4: Risk + Backtesting Expansion
- Risk service:
  - Historical/Parametric VaR
  - CVaR
  - Volatility clustering (GARCH-family)
  - Crash regime alerts
- Backtesting service:
  - RSI/MA crossover/ML-signal strategies
  - Transaction cost and slippage modeling
  - Equity curve + max drawdown + Sharpe + Sortino + Calmar

## Phase 5: Enterprise System Design Features
- OAuth2 authorization server
- Refresh token rotation + revocation store
- Saga orchestration for cross-service workflows
- Kafka event streaming
- Distributed tracing (OpenTelemetry + Zipkin/Tempo)
- Circuit breakers and retries (Resilience4j)
- API rate limiting
- Policy-based access control and audit logs

## Phase 6: Cloud Readiness
- Helm chart per environment (`dev`, `staging`, `prod`)
- Externalized secrets (AWS Secrets Manager / GCP Secret Manager / Azure Key Vault)
- Managed databases and message brokers
- CI/CD:
  - Build + scan images
  - Run tests
  - Deploy via GitHub Actions + Argo CD
- SLO dashboards and error-budget alerts
