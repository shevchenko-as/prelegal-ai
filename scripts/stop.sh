#!/usr/bin/env bash

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS_FILE="$ROOT/.pids"

if [ ! -f "$PIDS_FILE" ]; then
  echo "No running processes found (.pids file missing)."
  exit 0
fi

read -r BACKEND_PID FRONTEND_PID < "$PIDS_FILE"

for PID in $BACKEND_PID $FRONTEND_PID; do
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" && echo "Stopped PID $PID"
  fi
done

rm -f "$PIDS_FILE"
echo "Prelegal AI stopped."
