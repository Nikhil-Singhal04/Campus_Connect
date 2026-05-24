# Campus Connect - One-Command Backend Startup
# Run with: .\run-backend-final.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Campus Connect - Backend Startup"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-DockerReady {
    try {
        docker version >$null 2>&1
        return $true
    } catch {
        return $false
    }
}

function Start-DockerDesktopIfAvailable {
    $possiblePaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles(x86)\Docker\Docker\Docker Desktop.exe"
    )

    foreach ($desktopPath in $possiblePaths) {
        if (Test-Path $desktopPath) {
            Write-Host "[INFO] Starting Docker Desktop..." -ForegroundColor Cyan
            Start-Process -FilePath $desktopPath | Out-Null
            return $true
        }
    }

    return $false
}

if (-not (Test-DockerReady)) {
    Start-DockerDesktopIfAvailable | Out-Null

    $attempts = 0
    while (-not (Test-DockerReady) -and $attempts -lt 60) {
        Start-Sleep -Seconds 2
        $attempts++
    }
}

if (-not (Test-DockerReady)) {
    Write-Host "[ERROR] Docker is not installed or not running" -ForegroundColor Red
    Write-Host "[INFO] Install Docker Desktop or start it, then run npm start again." -ForegroundColor Yellow
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
