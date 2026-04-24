param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-04" -PhaseName "Testes criticos e coverage" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-006, TD-007, TD-008, TD-009, TD-021."
Invoke-PhaseCommand -Step "api-tests-package" -Command "pnpm --filter @birthub/api test" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "web-tests-package" -Command "pnpm --filter @birthub/web test" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "worker-tests-package" -Command "pnpm --filter @birthub/worker test" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "database-tests-package" -Command "pnpm --filter @birthub/database test" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "manual-auth-security-billing" -Command "node --import tsx --test --test-concurrency=1 apps/api/tests/auth.test.ts apps/api/tests/security.test.ts apps/api/tests/billing.webhook.test.ts" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "manual-web-tests" -Command "node --import tsx --test apps/web/tests/*.test.ts" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "manual-worker-agent-tests" -Command "node --import tsx --test --test-concurrency=1 apps/worker/src/agents/runtime.tools.test.ts apps/worker/src/agents/runtime.tools.db-write.test.ts apps/worker/src/agents/runtime.orchestration.test.ts" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "skipped-focused-tests" -Pattern "test\.skip|describe\.skip|it\.skip|\.only\(" -Path "apps packages tests"
Invoke-PhaseCommand -Step "coverage-root" -Command "pnpm test:coverage" -AllowFail | Out-Null

Add-PhaseNote @"
Checklist de aceite:
- Scripts sh/find substituidos por runner Node cross-platform.
- Database test descobre testes reais.
- Suites de consentimento/retencao/FHIR/clinico reativadas ou lane separada documentada.
- Coverage real gerado e publicado por pacote.
"@
Finish-Phase
