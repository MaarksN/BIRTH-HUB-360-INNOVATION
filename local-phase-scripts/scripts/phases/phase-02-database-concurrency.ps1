param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-02" -PhaseName "Banco transacoes idempotencia e concorrencia" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-010, TD-011, TD-012, TD-040."
Invoke-PhaseCommand -Step "prisma-validate" -Command "pnpm --filter @birthub/database exec prisma validate --schema prisma/schema.prisma" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "db-governance" -Command "pnpm --filter @birthub/database db:check:governance" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "database-tests" -Command "pnpm --filter @birthub/database test" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "money-float-fields" -Pattern "Brl\s+Float|amount\s+Float|price\s+Float|cost\s+Float|limitBrl|consumedBrl|costBrl" -Path "packages/database"
Invoke-RgOrSkip -Step "nullable-tenant-org" -Pattern "tenantId\s+String\?|organizationId\s+String\?|tenantId.*\?|organizationId.*\?" -Path "packages/database"
Invoke-RgOrSkip -Step "idempotency-transactions" -Pattern "idempot|transaction|upsert|retry|dedupe|lock|outbox" -Path "apps packages"
Invoke-PhaseCommand -Step "restore-scripts-present" -Command "Get-ChildItem scripts,ops -Recurse -File -ErrorAction SilentlyContinue | Where-Object { `$_.Name -match 'backup|restore|rollback|migrate' } | Select-Object FullName" -AllowFail | Out-Null

Add-PhaseNote @"
Checklist de aceite:
- Registry de migrations corrigido.
- Plano de migracao de Float monetario para Int centavos ou Decimal.
- Casos globais de tenantId/organizationId nullable documentados ou transformados em obrigatorios.
- Restore drill executado somente em banco descartavel.
"@
Finish-Phase
