$ErrorActionPreference = 'Continue'

Set-Location -LiteralPath 'C:\Users\ADMIN\OneDrive\Documents\GitHub\desktop-tutorial\CODE\NATIONAL_SPACE_HACKATHON\frontend'
Write-Output 'Killing node/npm processes (if any)...'
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Get-Process -Name npm -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

Write-Output 'Stopping OneDrive (if running)...'
Get-Process -Name OneDrive -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

Write-Output 'Attempting rd delete of node_modules...'
cmd /c "rd /s /q node_modules"

if (Test-Path node_modules) {
    Write-Output 'Remove-Item fallback...'
    Remove-Item -LiteralPath node_modules -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path node_modules) {
    Write-Output 'Attempting takeown/icacls and retry...'
    & takeown /F node_modules /R /D Y
    & icacls node_modules /grant "$($env:USERNAME):(F)" /T /C
    Remove-Item -LiteralPath node_modules -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path node_modules) {
    Write-Output 'Failed to remove node_modules. Listing top-level contents for inspection:'
    Get-ChildItem node_modules -Force -ErrorAction SilentlyContinue | Select-Object -First 50 | Format-List | Out-String | Write-Output
    Exit 2
}

Write-Output 'Removing package-lock.json if present...'
if (Test-Path package-lock.json) { Remove-Item -LiteralPath package-lock.json -Force -ErrorAction SilentlyContinue }

Write-Output 'Cleaning npm cache...'
npm cache clean --force

Write-Output 'Running npm install (this may take a few minutes)...'
npm install
