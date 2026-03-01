# DB Table to Microservice Mapping

Schema: `invest_platform_ai`

## Auth Service
- `users`
  - mapped via JPA entity `User`
  - file: `auth-service/src/main/java/com/investai/auth/model/User.java`
- `refresh_tokens`
  - mapped via JPA entity `RefreshToken`
  - file: `auth-service/src/main/java/com/investai/auth/model/RefreshToken.java`

## Portfolio Service
- `portfolios`
  - mapped via JPA entity `Portfolio`
  - file: `portfolio-service/src/main/java/com/investai/portfolio/model/Portfolio.java`
- `holdings`
  - mapped via JPA entity `Holding`
  - file: `portfolio-service/src/main/java/com/investai/portfolio/model/Holding.java`
- `trades`
  - mapped via JPA entity `Trade` (entity/repository added, endpoint integration pending)
  - file: `portfolio-service/src/main/java/com/investai/portfolio/model/Trade.java`

## ML Service
- `predictions`
  - target owner: `ml-service`
  - current state: not persisted yet (in-memory model only)

## Risk Service
- `risk_metrics`
  - target owner: `risk-service`
  - current state: not persisted yet (compute-only API today)

## Notes
- Auth and portfolio now resolve identities using `X-User-Id` propagated by gateway.
- Both services are configured to use PostgreSQL and validate against existing schema.
