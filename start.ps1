# ─── TranscendCapacity — Start Script ───────────────────────────────────────
# Uso: .\start.ps1
# Resultado: http://localhost:8000

$root = $PSScriptRoot

Write-Host ""
Write-Host "=== [1/2] Building frontend ===" -ForegroundColor Cyan
cmd /c "cd /d `"$root\frontend`" && npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Fix frontend errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== [2/2] Starting FastAPI server ===" -ForegroundColor Cyan
Write-Host "    App:      http://localhost:8000" -ForegroundColor Green
Write-Host "    API docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
cmd /c "cd /d `"$root\backend`" && python -m uvicorn main:app --reload --port 8000"
