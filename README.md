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

Health checks:
- `http://localhost:8080/actuator/health`
- `http://localhost:8083/health`
- `http://localhost:8084/health`
- `http://localhost:8085/health`
- `http://localhost:8086/health`

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
