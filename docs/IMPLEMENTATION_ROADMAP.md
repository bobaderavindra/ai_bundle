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
- Frontend baseline:
  - React + TypeScript + Vite app scaffold
  - API integration via gateway
  - Authentication flow (login/register/token persistence)
  - Theme-aware dashboard shell

## Phase 2: Data + Persistence
- Add PostgreSQL for auth/portfolio state
- Add Redis for caching + token/session acceleration
- Add vector database (pgvector, Qdrant, or Pinecone) for research-service
- Add schema migrations with Flyway/Liquibase
- Frontend data integration:
  - Replace mocked UI values with persisted backend state
  - Portfolio/holdings/trades pages with optimistic updates
  - Error/loading/empty-state UX for every panel

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
- Frontend AI views:
  - Prediction console with confidence/risk overlays
  - Model version selector (MLflow model registry integration)
  - Explainability panel for SHAP/feature contribution

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
- Frontend quant tooling:
  - Advanced charting suite (candlestick, RSI, MACD, Bollinger)
  - Drag-and-drop strategy builder with rule validation
  - Backtest report UX (equity curve + metrics + trade log export)
  - Portfolio allocation and risk heatmaps

## Phase 5: Enterprise System Design Features
- OAuth2 authorization server
- Refresh token rotation + revocation store
- Saga orchestration for cross-service workflows
- Kafka event streaming
- Distributed tracing (OpenTelemetry + Zipkin/Tempo)
- Circuit breakers and retries (Resilience4j)
- API rate limiting
- Policy-based access control and audit logs
- Frontend enterprise UX:
  - Role-based UI rendering (admin/advisor/investor)
  - Tenant-aware SaaS navigation and org switching
  - Audit-friendly activity feeds and approvals UI
  - Feature flags and environment banners (dev/stage/prod)

## Phase 6: Cloud Readiness
- Helm chart per environment (`dev`, `staging`, `prod`)
- Externalized secrets (AWS Secrets Manager / GCP Secret Manager / Azure Key Vault)
- Managed databases and message brokers
- CI/CD:
  - Build + scan images
  - Run tests
  - Deploy via GitHub Actions + Argo CD
- SLO dashboards and error-budget alerts
- Frontend cloud delivery:
  - S3 + CloudFront hosting with cache invalidation pipeline
  - Separate config per environment (`VITE_API_BASE_URL`, websocket URL)
  - WAF + TLS + CDN cache strategy for SPA assets and API gateway paths
  - Lighthouse performance budgets and synthetic monitoring

## Phase 7: Commands to run the application locally
- Command to run Microservice locally 
  - cd microservice
  - .\..\mvnw.cmd spring-boot:run
- Command to run Frontend locally
  - cd frontend
  - npm run dev
- Commands to run python ml-service
  - cd ml-service
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    uvicorn api.main:app --host 0.0.0.0 --port 8095 --reload
  - cd optimization-service
    - uvicorn api.main:app --host 0.0.0.0 --port 8096 --reload
