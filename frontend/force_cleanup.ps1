$ErrorActionPreference = 'Continue'

Set-Location -LiteralPath 'C:\Users\ADMIN\OneDrive\Documents\GitHub\desktop-tutorial\CODE\NATIONAL_SPACE_HACKATHON\frontend'
Write-Output 'Creating temporary empty folder...'
$tmp = 'C:\temp_node_clean'
if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $tmp | Out-Null

Write-Output 'Mirroring empty folder into node_modules with robocopy...'
robocopy $tmp .\node_modules /MIR | Out-Null

Write-Output 'Attempt Remove-Item fallback...'
if (Test-Path node_modules) {
    Remove-Item -LiteralPath node_modules -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output 'Cleaning temporary folder...'
if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue }

Write-Output 'Cleaning npm cache...'
npm cache clean --force

Write-Output 'Running npm install...'
npm install
