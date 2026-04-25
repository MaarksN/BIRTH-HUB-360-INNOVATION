param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-07" -PhaseName "Integracoes resiliencia e filas" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-003, TD-016, webhooks, retry/backoff/DLQ."
Invoke-RgOrSkip -Step "fetch-surface" -Pattern "fetch\(" -Path "apps packages"
Invoke-RgOrSkip -Step "timeout-abort-surface" -Pattern "AbortSignal|fetchWithTimeout|timeout|Promise\.race|setTimeout" -Path "apps packages"
Invoke-RgOrSkip -Step "retry-backoff-dlq" -Pattern "retry|backoff|DLQ|dead.?letter|ack|nack|dedupe|idempot" -Path "apps packages"
Invoke-RgOrSkip -Step "tokens-in-integration-url" -Pattern "access_token=|api_token=|api_secret|token=\$\{|[?&](token|api_key|apiSecret|api_secret)=" -Path "packages/integrations apps"
Invoke-PhaseCommand -Step "webhook-tests" -Command "node --import tsx --test apps/api/tests/*webhook*.test.ts apps/worker/test/*webhook*.test.ts" -AllowFail | Out-Null

Add-PhaseNote @"
Checklist de aceite:
- Nenhum fetch externo sem timeout/cancelamento.
- Webhooks idempotentes, assinados e com replay protegido.
- DLQ/backoff/dedupe testados.
- Fault injection para API externa lenta/indisponivel.
"@
Finish-Phase
