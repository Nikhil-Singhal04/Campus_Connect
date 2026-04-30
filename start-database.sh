#!/bin/bash
# Campus Connect - Auto Start Database and Backend
# This script starts Docker containers and ensures they run automatically

echo "========================================"
echo "Campus Connect - Auto Startup Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH"
    exit 1
fi

docker ps > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[ERROR] Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "[INFO] Docker is running..."
echo ""

# Navigate to script directory
cd "$(dirname "$0")" || exit 1

echo "[INFO] Starting services..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start services"
    exit 1
fi

echo ""
echo "[SUCCESS] Services started!"
echo ""
echo "Services running:"
docker-compose ps
echo ""
echo "[INFO] Backend API: http://localhost:4000"
echo "[INFO] PostgreSQL: localhost:5432"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
echo ""
