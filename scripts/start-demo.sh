#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[1/2] Starting MVP backend..."
echo "Demo UI:  http://localhost:8787/"
echo "Status:   http://localhost:8787/project-status"
echo "Health:   http://localhost:8787/health"
node backend/server.js
