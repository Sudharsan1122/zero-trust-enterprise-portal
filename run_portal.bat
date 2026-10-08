@echo off
echo ========================================================
echo   ZERO-TRUST ENTERPRISE ACCESS PORTAL (NIST SP 800-207)
echo   Software Security Engineering (SSE) Platform
echo ========================================================
echo.

echo Starting Python FastAPI Backend Server on http://localhost:8001 ...
start "Zero-Trust Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 3 /nobreak >nul

echo Starting Vite React Frontend on http://localhost:5173 ...
start "Zero-Trust Frontend (Vite/React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers launched!
echo Access the portal at: http://localhost:5173
echo API documentation at: http://localhost:8001/docs
echo ========================================================
pause
