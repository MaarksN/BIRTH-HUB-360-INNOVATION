param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-11" -PhaseName "Privacidade LGPD e qualidade de dados" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-012, TD-038, dados pessoais e retencao."
Invoke-PhaseCommand -Step "consent-retention-tests" -Command "node --import tsx --test apps/api/tests/consent.service.test.ts apps/api/tests/retention.service.test.ts" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "pii-field-scan" -Pattern "email|phone|cpf|cnpj|document|birthDate|ipAddress|address|patient|clinical|health|consent|retention" -Path "apps packages tests"
Invoke-RgOrSkip -Step "privacy-test-skips" -Pattern "test\.skip|describe\.skip|it\.skip" -Path "apps/api/tests apps/web/tests"
Invoke-RgOrSkip -Step "export-delete-retention" -Pattern "export|delete|erase|anonymize|retention|consent|revoke|grant|LGPD|privacy" -Path "apps packages"
Invoke-RgOrSkip -Step "logs-seeds-fixtures-pii" -Pattern "email|phone|cpf|document|ipAddress|Authorization|Bearer|token|secret" -Path "apps packages tests prisma scripts"

Add-PhaseNote @"
Checklist de aceite:
- Testes LGPD verdes.
- PII classificada no schema.
- Export/delete testados ponta a ponta.
- Logs, seeds e fixtures com DLP scan.
- Politica de retencao e expurgo documentada.
"@
Finish-Phase
