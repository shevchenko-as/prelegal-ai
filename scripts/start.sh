#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS_FILE="$ROOT/.pids"

echo "Starting Prelegal AI..."

# ── Backend ──
cd "$ROOT/backend"
if ! [ -d ".venv" ]; then
  echo "  Creating Python virtual environment..."
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &> "$ROOT/.backend.log" &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# ── Frontend ──
cd "$ROOT/frontend"
if ! [ -d "node_modules" ]; then
  echo "  Installing frontend dependencies..."
  npm install --silent
fi
npm run dev -- -p 3000 &> "$ROOT/.frontend.log" &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# Save PIDs
echo "$BACKEND_PID $FRONTEND_PID" > "$PIDS_FILE"

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Run scripts/stop.sh to stop."
