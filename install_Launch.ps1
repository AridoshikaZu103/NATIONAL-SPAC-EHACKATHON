# ========================================
# Orbital Insight SSA - Install & Launch
# ========================================
# Usage: .\install_Launch.ps1
# This script installs all dependencies and launches both servers.
# ========================================

Write-Host ""
Write-Host "  ORBITAL INSIGHT SSA - Install & Launch" -ForegroundColor Cyan
Write-Host "  =======================================" -ForegroundColor DarkCyan
Write-Host ""

# ------- Backend Setup -------
Write-Host "  [1/4] Setting up Backend..." -ForegroundColor Yellow

if (!(Test-Path "backend\.venv")) {
    Write-Host "         Creating Python virtual environment..." -ForegroundColor DarkGray
    Set-Location backend
    python -m venv .venv
    Set-Location ..
}

Write-Host "         Activating venv and installing dependencies..." -ForegroundColor DarkGray
Set-Location backend
& ".\.venv\Scripts\activate"
pip install -r requirements.txt --quiet 2>$null
Set-Location ..
Write-Host "         Backend ready." -ForegroundColor Green

# ------- Frontend Setup -------
Write-Host "  [2/4] Setting up Frontend..." -ForegroundColor Yellow

if (!(Test-Path "frontend\node_modules")) {
    Write-Host "         Installing npm packages..." -ForegroundColor DarkGray
    Set-Location frontend
    npm install --silent 2>$null
    Set-Location ..
} else {
    Write-Host "         node_modules found. Skipping install." -ForegroundColor DarkGray
}
Write-Host "         Frontend ready." -ForegroundColor Green

# ------- Launch Backend -------
Write-Host "  [3/4] Starting Backend (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\backend'; .\.venv\Scripts\activate; python main.py"

# ------- Launch Frontend -------
Write-Host "  [4/4] Starting Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "  All systems GO!" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
