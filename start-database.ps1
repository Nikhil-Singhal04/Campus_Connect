# Campus Connect - Auto Start Database and Backend
# PowerShell Script - Run with: powershell -ExecutionPolicy Bypass -File start-database.ps1

Write-Host "========================================"
Write-Host "Campus Connect - Auto Startup Script"
Write-Host "========================================"
Write-Host ""

# Check if Docker is running
try {
    $dockerVersion = docker version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Docker is running..." -ForegroundColor Green
Write-Host ""

# Navigate to script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[INFO] Starting services..." -ForegroundColor Cyan

# Start containers
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:"
docker-compose ps
Write-Host ""
Write-Host "[INFO] Backend API: http://localhost:4000" -ForegroundColor Yellow
Write-Host "[INFO] PostgreSQL: localhost:5432" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs: docker-compose logs -f"
Write-Host "To stop services: docker-compose down"
Write-Host ""
