Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  ZERO-TRUST ENTERPRISE ACCESS PORTAL (NIST SP 800-207)" -ForegroundColor Cyan
Write-Host "  Software Security Engineering (SSE) Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting FastAPI Backend on http://localhost:8001 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; .\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

Start-Sleep -Seconds 3

Write-Host "Starting Vite React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend'; npm run dev"

Write-Host ""
Write-Host "Servers launched!" -ForegroundColor Yellow
Write-Host "Portal Web UI:   http://localhost:5173" -ForegroundColor Yellow
Write-Host "FastAPI Swagger: http://localhost:8001/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
