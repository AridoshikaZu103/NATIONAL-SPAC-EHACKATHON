# ============================================
# start.ps1 — Launch Backend + Frontend
# Run from project root: .\start.ps1
# ============================================

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

Write-Host ""
Write-Host "  ORBITAL INSIGHT SSA — Starting Servers" -ForegroundColor Cyan
Write-Host "  =======================================" -ForegroundColor DarkCyan
Write-Host ""

# ── Backend (Python + venv) ──
Write-Host "  [1/2] Starting Backend (port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$root\backend'
Write-Host '--- BACKEND SERVER ---' -ForegroundColor Cyan
Write-Host 'Activating virtual environment...' -ForegroundColor DarkGray
& '$root\.venv\Scripts\Activate.ps1'
Write-Host 'Starting FastAPI on http://localhost:8000' -ForegroundColor Green
python main.py
"@

Start-Sleep -Seconds 2

# ── Frontend (Vite + React) ──
Write-Host "  [2/2] Starting Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Set-Location '$root\frontend'
Write-Host '--- FRONTEND DEV SERVER ---' -ForegroundColor Cyan
Write-Host 'Starting Vite on http://localhost:5173' -ForegroundColor Yellow
npm run dev
"@

Write-Host ""
Write-Host "  Both servers launching in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Press Ctrl+C in each window to stop." -ForegroundColor DarkGray
Write-Host ""
