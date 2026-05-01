@echo off
REM Campus Connect - Run Full Backend Stack in One Command
REM Starts PostgreSQL and Backend together

echo.
echo ========================================
echo Campus Connect - Full Backend Stack
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [INFO] Docker is running
echo [INFO] Starting full stack (PostgreSQL + Backend)...
echo [INFO] Backend will be available at: http://localhost:4000
echo.

REM Get the script directory
set scriptDir=%~dp0
cd /d "%scriptDir%"

REM Start everything
docker-compose up

REM Cleanup on exit
echo.
echo [INFO] Stopping all services...
docker-compose down

pause
