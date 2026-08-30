#!/usr/bin/env bash
# Start the Job Search Command Center locally.
set -e
echo "[1/2] Starting backend (FastAPI) on http://localhost:8777"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8777 &
BACK_PID=$!

echo "[2/2] Starting frontend (Vite) on http://localhost:5173"
(cd frontend && npm run dev) &
FRONT_PID=$!

trap "kill $BACK_PID $FRONT_PID 2>/dev/null" EXIT
wait
