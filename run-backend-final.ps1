# Campus Connect - One-Command Backend Startup
# Run with: .\run-backend-final.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campus Connect - Backend Startup"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    docker version >$null 2>&1
} catch {
    Write-Host "[ERROR] Docker is not installed or not running" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Starting full stack with docker-compose..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Navigate to script directory where docker-compose.yml is located
Set-Location $scriptDir

# Start the full stack (postgres + backend container)
Write-Host "[INFO] Pulling latest images and starting services..." -ForegroundColor Cyan
docker-compose up

# When user stops it (Ctrl+C), clean up
Write-Host ""
Write-Host "[INFO] Stopping services..." -ForegroundColor Yellow
docker-compose down
