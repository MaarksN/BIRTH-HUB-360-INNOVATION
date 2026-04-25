param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-06" -PhaseName "Observabilidade e operacao" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-029, TD-030."
Invoke-PhaseCommand -Step "audit-redaction-test" -Command "node --import tsx --test apps/api/tests/audit-redaction.test.ts" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "console-logs" -Pattern "console\.(log|error|warn|info)" -Path "apps packages"
Invoke-RgOrSkip -Step "log-context-fields" -Pattern "requestId|request_id|tenantId|tenant_id|correlationId|correlation_id|traceId|spanId" -Path "apps packages"
Invoke-RgOrSkip -Step "pii-redaction-patterns" -Pattern "redact|mask|sanitize|email|phone|cpf|document|ipAddress|token|secret" -Path "apps packages"
Invoke-RgOrSkip -Step "health-readiness" -Pattern "health|readiness|liveness|metrics|otel|OpenTelemetry|Sentry" -Path "apps packages"

Add-PhaseNote @"
Checklist de aceite:
- Logs estruturados sem requestId/request_id duplicados.
- PII/tokens mascarados nos logs.
- correlationId/requestId presente nos fluxos API/webhook/worker.
- Health/readiness testados.
"@
Finish-Phase
