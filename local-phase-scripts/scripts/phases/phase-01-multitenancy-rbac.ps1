param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-01" -PhaseName "Multi-tenancy RBAC e matriz de permissoes" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-013, TD-014, TD-012, TD-020, TD-036."
Invoke-RgOrSkip -Step "prisma-query-surface" -Pattern "prisma\..*\.(findMany|findFirst|findUnique|update|updateMany|delete|deleteMany|create|upsert)" -Path "apps packages"
Invoke-RgOrSkip -Step "tenant-scope-patterns" -Pattern "tenantId|organizationId|ownerId|RequireRole|requireRole|rbac|permission" -Path "apps packages"
Invoke-RgOrSkip -Step "zenvia-webhook-lookup" -Pattern "ZENVIA|zenvia|connectorAccountId|provider.*zenvia" -Path "apps packages"
Invoke-RgOrSkip -Step "admin-destructive-actions" -Pattern "Cancelar|Replay|cancel|replay|delete|destroy|archive" -Path "apps/web"
Invoke-PhaseCommand -Step "eslint-api-worker" -Command "pnpm exec eslint apps/api apps/worker" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "test-isolation" -Command "pnpm test:isolation" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "tenant-rbac-tests" -Command "node --import tsx --test apps/api/tests/*tenant*.test.ts apps/api/tests/*rbac*.test.ts" -AllowFail | Out-Null

Add-PhaseNote @"
Checklist de aceite:
- Matriz role/permission/tenant/ownership criada.
- Regra no-unscoped-prisma-query ampliada para apps/api e apps/worker com allowlist explicita.
- Testes negativos cross-tenant incluidos no CI.
- Admin global separado de admin tenant.
"@
Finish-Phase
