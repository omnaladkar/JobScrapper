@echo off
REM Start the Job Search Command Center locally.
REM Requires: Python 3.10+ and Node 18+ installed.

echo [1/2] Starting backend (FastAPI) on http://localhost:8777 ...
start "backend" cmd /k python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8777

echo [2/2] Starting frontend (Vite) on http://localhost:5173 ...
cd frontend
start "frontend" cmd /k npm run dev
cd ..

echo.
echo Open http://localhost:5173 in your browser.
pause
