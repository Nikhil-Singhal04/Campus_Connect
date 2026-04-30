@echo off
REM Campus Connect - Auto Start Database and Backend
REM This script starts Docker containers and ensures they run automatically

echo ========================================
echo Campus Connect - Auto Startup Script
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker is running...
echo.

REM Navigate to project directory
cd /d "%~dp0" || exit /b 1

echo [INFO] Starting services...
docker-compose up -d

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Services started!
echo.
echo Services running:
docker-compose ps
echo.
echo [INFO] Backend API: http://localhost:4000
echo [INFO] PostgreSQL: localhost:5432
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.
pause
