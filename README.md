# InvestAI Platform

Enterprise AI investment platform using a microservices architecture with local-first runtime and cloud-ready deployment manifests.

## Services

- `gateway-service` (Spring Cloud Gateway, `8080`)
- `auth-service` (Spring Boot JWT auth, `8081`)
- `portfolio-service` (Spring Boot portfolio API, `8082`)
- `risk-service` (FastAPI risk engine, `8083`)
- `research-service` (FastAPI RAG starter, `8084`)
- `ml-service` (FastAPI prediction starter, `8085`)
- `optimization-service` (FastAPI portfolio optimization, `8086`)
- `frontend` (React fintech dashboard via Nginx, `3000`)
- `redis` (cache, `6379`)

## Local Run

### Prerequisites
- Docker Desktop

### Start stack
```powershell
docker compose up --build -d
```

Or use:
```powershell
.\scripts\start-local.ps1 -Build
```

Gateway entry point:
- `http://localhost:8080`
- Frontend UI: `http://localhost:3000`

Health checks:
- `http://localhost:8080/actuator/health`
- `http://localhost:8083/health`
- `http://localhost:8084/health`
- `http://localhost:8085/health`
- `http://localhost:8086/health`
- `http://localhost:5000` (MLflow UI)
 - Redis: `redis-cli ping` -> `PONG`

## API Quickstart

1. Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@investai.com","fullName":"Test User","password":"Pass@123"}'
```

2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@investai.com","password":"Pass@123"}'
```

2.1 Current user profile
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

3. Create portfolio
```bash
curl -X POST http://localhost:8080/api/portfolio \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Long Term Growth"}'
```

4. Portfolio optimization (mean-variance)
```bash
curl -X POST http://localhost:8080/api/optimization/mean-variance \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "assets":[
      {"symbol":"AAPL","expectedReturn":0.14,"volatility":0.25},
      {"symbol":"MSFT","expectedReturn":0.12,"volatility":0.20},
      {"symbol":"GOOGL","expectedReturn":0.13,"volatility":0.23}
    ],
    "correlationMatrix":[
      [1.0,0.6,0.55],
      [0.6,1.0,0.5],
      [0.55,0.5,1.0]
    ],
    "riskFreeRate":0.03
  }'
```

5. Risk VaR
```bash
curl -X POST http://localhost:8080/api/risk/var \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"returns":[-0.02,0.01,-0.01,0.005,-0.03],"confidence":0.95}'

curl -X GET "http://localhost:8080/api/risk/var/<PORTFOLIO_ID>?confidence=0.95&simulations=5000" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

curl -X GET http://localhost:8080/api/risk/drawdown/<PORTFOLIO_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

6. Portfolio trades and allocation
```bash
curl -X GET http://localhost:8080/api/portfolio/<USER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

curl -X POST http://localhost:8080/api/trade \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"portfolioId":"<PORTFOLIO_ID>","symbol":"AAPL","tradeType":"BUY","quantity":10,"price":182.50}'

curl -X GET "http://localhost:8080/api/allocation?portfolioId=<PORTFOLIO_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

7. ML predict/train/model-info
```bash
curl -X POST http://localhost:8080/api/ml/train \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"prices":[100,102,105,107,110]}'

curl -X POST http://localhost:8080/api/ml/predict \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nextIndex":6}'

curl -X GET http://localhost:8080/api/ml/model-info \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

10. ML time-series finance endpoints
```bash
curl -X POST http://localhost:8080/api/ml/time-series/forecast \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "series":[
      {"date":"2026-03-01","amount":250,"category":"Food"},
      {"date":"2026-03-02","amount":275,"category":"Food"},
      {"date":"2026-03-03","amount":290,"category":"Bills"}
    ],
    "periods": 1,
    "budgetLimit": 400
  }'

curl -X POST http://localhost:8080/api/ml/time-series/patterns \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "series":[
      {"date":"2026-03-01","amount":250,"category":"Food"},
      {"date":"2026-03-07","amount":480,"category":"Shopping"},
      {"date":"2026-03-08","amount":520,"category":"Travel"}
    ]
  }'

curl -X POST http://localhost:8080/api/ml/time-series/anomalies \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "series":[
      {"date":"2026-03-01","amount":180,"category":"Food"},
      {"date":"2026-03-02","amount":190,"category":"Food"},
      {"date":"2026-03-03","amount":900,"category":"Travel"}
    ],
    "zScoreThreshold": 1.5
  }'

curl -X POST http://localhost:8080/api/ml/time-series/credit-utilization \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "series":[
      {"date":"2026-03-01","amount":180},
      {"date":"2026-03-02","amount":210},
      {"date":"2026-03-03","amount":240}
    ],
    "limitAmount": 1200,
    "currentBalance": 650
  }'

curl -X POST http://localhost:8080/api/ml/time-series/trip-budget \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "series":[
      {"date":"2026-03-01","amount":120,"category":"Food"},
      {"date":"2026-03-02","amount":220,"category":"Travel"},
      {"date":"2026-03-03","amount":140,"category":"Local Transport"}
    ],
    "tripDays": 5,
    "totalBudget": 700
  }'
```

MLflow:
- Tracking server: `http://localhost:5000`
- Tracks experiments for LSTM and Transformer training runs
- Registers model versions in MLflow Model Registry

You can confidently state:
- "We use MLflow for experiment tracking and model versioning."

8. Research RAG (PDF -> embeddings -> FAISS -> LLM)
```bash
curl -X POST http://localhost:8080/api/research/upload \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@C:/path/to/annual-report.pdf" \
  -F "docId=acme-annual-2025"

curl -X POST http://localhost:8080/api/research/ask \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the main risk factors mentioned?","topK":4}'
```

9. Optimization Kafka events (publish + consume)
```bash
# Trigger optimization to publish events to Kafka topic: optimization.events
curl -X POST http://localhost:8080/api/optimization/mean-variance \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "assets":[
      {"symbol":"AAPL","expectedReturn":0.14,"volatility":0.25},
      {"symbol":"MSFT","expectedReturn":0.12,"volatility":0.20},
      {"symbol":"GOOGL","expectedReturn":0.13,"volatility":0.23}
    ],
    "correlationMatrix":[
      [1.0,0.6,0.55],
      [0.6,1.0,0.5],
      [0.55,0.5,1.0]
    ],
    "riskFreeRate":0.03
  }'

# Read optimization Kafka consumer status
curl -X GET http://localhost:8080/api/optimization/events/status \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Read most recent consumed Kafka messages in optimization-service
curl -X GET http://localhost:8080/api/optimization/events/recent \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Kafka Communication Overview

Kafka is used for asynchronous, decoupled communication between services. Each service publishes domain events to a topic and other services subscribe without direct HTTP calls.

Topics in use:
- `portfolio.trade.executed`  
  Produced by `portfolio-service` when a trade is executed. Consumed by `portfolio-service` (for recent event cache), `optimization-service`, and `risk-service`.
- `optimization.events`  
  Produced by `optimization-service` for optimization request lifecycle events. Consumed by `risk-service`.
- `risk.events`  
  Produced by `risk-service` for VaR and drawdown lifecycle events. No explicit consumer is defined yet (available for future services or observability).

Time-series integration path:
- `portfolio-service` or an expense-oriented service can publish daily spend aggregates to a Kafka topic such as `expense-events`.
- `ml-service` can consume those events, run the `/ml/time-series/*` calculations, and publish derived alerts or forecasts to a topic such as `ml-predictions`.
- Gateway-backed APIs or websocket push can surface the latest forecast, anomaly alerts, and utilization risk in the frontend dashboard.

How events flow:
- Services publish a JSON envelope with `eventType`, `service`, `timestamp`, and `payload`.
- `risk-service` and `optimization-service` run a KafkaBus that starts a producer and a background consumer thread on startup.
- Each service can expose recent consumed messages via `/events/recent` endpoints for quick inspection.

Config wiring:
- `KAFKA_BOOTSTRAP_SERVERS` points services to the broker (`kafka:9092` in Docker Compose).
- Topic names and consumer groups are configured through env vars:
  - `PORTFOLIO_TRADE_TOPIC`
  - `OPTIMIZATION_EVENT_TOPIC`
  - `RISK_EVENT_TOPIC`
  - `OPTIMIZATION_CONSUME_TOPICS`
  - `RISK_CONSUME_TOPICS`

## Redis Cache

Portfolio reads are cached using Spring Cache + Redis with JSON serialization and per-cache TTLs:
- `portfoliosByUser` (30s)
- `portfolioById` (5m)
- `allocationByPortfolio` (2m)

Cache invalidation happens on portfolio mutations (create/update/addHolding/trade) to keep reads consistent.

Redis config (portfolio-service):
- `REDIS_HOST` (default `localhost`)
- `REDIS_PORT` (default `6379`)

## Frontend Features

- Real-time WebSocket stock price streaming (with local fallback simulator)
- Advanced charting using candlesticks + SMA indicator
- Portfolio allocation pie charts
- Drag-and-drop strategy builder UI
- SaaS-style theme system (`Ocean`, `Sand`, `Slate`)
- Role-based rendering (`ADMIN` panels are gated)
- Production Docker image (Nginx static hosting)

Frontend environment:
- `frontend/.env.example`

Local frontend dev:
```bash
cd frontend
npm install
npm run dev
```

You can now say:
- "We use MLflow for experiment tracking and model versioning."

## Kubernetes

Build and push images first, then deploy:

```bash
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## Cloud Readiness

Gateway routes are environment-driven using:
- `AUTH_SERVICE_URL`
- `PORTFOLIO_SERVICE_URL`
- `RISK_SERVICE_URL`
- `RESEARCH_SERVICE_URL`
- `ML_SERVICE_URL`
- `OPTIMIZATION_SERVICE_URL`

This allows the same image to run unchanged across local Docker, Kubernetes, and cloud runtimes.

## Auth Service Capabilities

- Spring Boot + Spring Security
- OAuth2 Authorization Server endpoints (`/oauth2/**`)
- PostgreSQL-backed users
- Endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /auth/me`
- JWT access token: 15 minutes
- Refresh token: 7 days
- Role claim included in JWT (`roles`)

## Next Implementation Phases

See roadmap:
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/DB_TABLE_SERVICE_MAPPING.md`

## Frontend AWS Deploy (S3 + CloudFront)

Manual script:
```powershell
.\scripts\deploy-frontend-aws.ps1 -Bucket <S3_BUCKET> -DistributionId <CF_DISTRIBUTION_ID> -Region us-east-1
```

GitHub Actions:
- Workflow: `.github/workflows/frontend-deploy.yml`
- Required secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET`
  - `AWS_CLOUDFRONT_DISTRIBUTION_ID`
  - `VITE_API_BASE_URL`
  - `VITE_STOCK_WS_URL`
