@echo off
REM Production-mode local run: FastAPI serves BOTH the API and the built SPA on one port.
REM Open http://localhost:8777 after it starts.
echo Building frontend...
pushd frontend
call npm run build
popd
echo Starting server on http://localhost:8777
python -m uvicorn app.main:app --host 0.0.0.0 --port 8777
