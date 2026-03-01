param(
    [switch]$Build
)

$ErrorActionPreference = "Stop"

Write-Host "Starting InvestAI local stack..."

if ($Build) {
    docker compose up --build -d
} else {
    docker compose up -d
}

Write-Host "Gateway: http://localhost:8080"
Write-Host "Health checks:"
Write-Host "  http://localhost:8080/actuator/health"
Write-Host "  http://localhost:8083/health"
Write-Host "  http://localhost:8084/health"
Write-Host "  http://localhost:8085/health"
Write-Host "  http://localhost:8086/health"
