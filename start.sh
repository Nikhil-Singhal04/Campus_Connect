



#!/bin/bash

# Campus Connect - Run Full Backend Stack in One Command
# Starts PostgreSQL and Backend together
# Usage: ./start.sh

set -e  # Exit on error

echo ""
echo "========================================"
echo "Campus Connect - Full Backend Stack"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker version &> /dev/null; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi

echo "[INFO] Docker is running"
echo "[INFO] Starting full stack (PostgreSQL + Backend)..."
echo "[INFO] Backend will be available at: http://localhost:4000"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to script directory where docker-compose.yml is located
cd "$SCRIPT_DIR"

# Start everything
docker-compose up

# Cleanup on exit
echo ""
echo "[INFO] Stopping all services..."
docker-compose down
