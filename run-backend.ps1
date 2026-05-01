# Campus Connect - Run Backend with Database in One Command
# Run with: powershell -ExecutionPolicy Bypass -File run-backend.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campus Connect - Backend Startup"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    $dockerVersion = docker version 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Docker is running" -ForegroundColor Green

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start only PostgreSQL (not the backend container)
Write-Host "[INFO] Starting PostgreSQL database..." -ForegroundColor Cyan
Set-Location $scriptDir
docker-compose up -d postgres

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

# Wait for PostgreSQL to be healthy
Write-Host "[INFO] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retries = 0

while ($retries -lt $maxRetries) {
    $healthStatus = docker inspect --format='{{.State.Health.Status}}' campus_connect_db 2>$null
    if ($healthStatus -eq "healthy") {
        Write-Host "[SUCCESS] PostgreSQL is ready!" -ForegroundColor Green
        break
    }
    $retries++
    Start-Sleep -Seconds 1
}

if ($healthStatus -ne "healthy") {
    Write-Host "[ERROR] PostgreSQL failed to start" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] Starting Backend API..." -ForegroundColor Cyan
Write-Host ""

# Start backend
Set-Location "$scriptDir\Backend"
npm start

# Cleanup on exit
Write-Host ""
Write-Host "[INFO] Stopping services..." -ForegroundColor Yellow
Set-Location $scriptDir
docker-compose down
