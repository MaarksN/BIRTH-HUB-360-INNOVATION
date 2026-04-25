param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = "",
  [switch]$StopOnFail
)

$phases = @("00","01","02","03","04","05","06","07","08","09","10","11","12")

foreach ($p in $phases) {
  Write-Host ""
  Write-Host "Executando fase $p..." -ForegroundColor Cyan
  if ([string]::IsNullOrWhiteSpace($ReportRoot)) {
  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Run-Phase.ps1") -Phase $p -RepoRoot $RepoRoot
} else {
  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Run-Phase.ps1") -Phase $p -RepoRoot $RepoRoot -ReportRoot $ReportRoot
}
  $code = $LASTEXITCODE
  if ($StopOnFail -and $code -ne 0) {
    Write-Host "Parando em fase $p com codigo $code." -ForegroundColor Red
    exit $code
  }
}

Write-Host ""
Write-Host "Todas as fases foram chamadas. Veja os relatorios em artifacts\local-remediation ou no ReportRoot escolhido." -ForegroundColor Green

