param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("0","1","2","3","4","5","6","7","8","9","10","11","12","00","01","02","03","04","05","06","07","08","09")]
  [string]$Phase,

  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)

$map = @{
  "0"="phase-00-security-critical.ps1"; "00"="phase-00-security-critical.ps1";
  "1"="phase-01-multitenancy-rbac.ps1"; "01"="phase-01-multitenancy-rbac.ps1";
  "2"="phase-02-database-concurrency.ps1"; "02"="phase-02-database-concurrency.ps1";
  "3"="phase-03-typecheck-quality.ps1"; "03"="phase-03-typecheck-quality.ps1";
  "4"="phase-04-tests-coverage.ps1"; "04"="phase-04-tests-coverage.ps1";
  "5"="phase-05-architecture-boundaries.ps1"; "05"="phase-05-architecture-boundaries.ps1";
  "6"="phase-06-observability-operations.ps1"; "06"="phase-06-observability-operations.ps1";
  "7"="phase-07-integrations-resilience.ps1"; "07"="phase-07-integrations-resilience.ps1";
  "8"="phase-08-ai-agents-tool-calling.ps1"; "08"="phase-08-ai-agents-tool-calling.ps1";
  "9"="phase-09-frontend-a11y-i18n.ps1"; "09"="phase-09-frontend-a11y-i18n.ps1";
  "10"="phase-10-supply-chain-release.ps1";
  "11"="phase-11-privacy-lgpd-data-quality.ps1";
  "12"="phase-12-devex-maintenance.ps1";
}

$script = Join-Path $PSScriptRoot ("phases\" + $map[$Phase])
if ([string]::IsNullOrWhiteSpace($ReportRoot)) {
  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $script -RepoRoot $RepoRoot
} else {
  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $script -RepoRoot $RepoRoot -ReportRoot $ReportRoot
}
exit $LASTEXITCODE


