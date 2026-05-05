#!/bin/bash

# Campus Connect - One-Command Backend Startup
# Run with: ./run-backend-final.sh

set -e  # Exit on error

echo "========================================"
echo "Campus Connect - Backend Startup"
echo "========================================"
echo ""

# Check Docker
if ! docker version &> /dev/null; then
    echo "[ERROR] Docker is not installed or not running"
    exit 1
fi

echo "[INFO] Starting full stack with docker-compose..."
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to script directory where docker-compose.yml is located
cd "$SCRIPT_DIR"

# Start the full stack (postgres + backend container)
echo "[INFO] Pulling latest images and starting services..."
docker-compose up

# When user stops it (Ctrl+C), clean up
echo ""
echo "[INFO] Stopping services..."
docker-compose down
