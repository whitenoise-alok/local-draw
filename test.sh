#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Backend ==="
cd "$ROOT/backend"
.venv/bin/pytest tests/ -v

echo ""
echo "=== Frontend ==="
cd "$ROOT/frontend"
./node_modules/.bin/vitest run
