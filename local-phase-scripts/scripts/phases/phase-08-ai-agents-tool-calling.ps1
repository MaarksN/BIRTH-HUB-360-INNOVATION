param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-08" -PhaseName "Agentes IA e tool calling seguro" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-031, TD-032."
Invoke-PhaseCommand -Step "agent-tests" -Command "node --import tsx --test apps/worker/src/agents/*.test.ts packages/agents-core/src/**/*.test.ts" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "tool-timeout-cancellation" -Pattern "Promise\.race|AbortSignal|timeout|signal|BaseTool|execute\(" -Path "packages/agents-core packages/agent-runtime apps/worker"
Invoke-RgOrSkip -Step "approval-sensitive-tools" -Pattern "approval|human|db-write|send-email|http|payment|connector-action|shell|code|workflow-enqueue" -Path "packages apps/worker"
Invoke-RgOrSkip -Step "prompt-injection-evals" -Pattern "prompt injection|injection|exfiltration|exfiltrate|secret|tenant escape|adversarial|eval" -Path "apps packages tests"
Invoke-RgOrSkip -Step "budgets-limits" -Pattern "budget|token|cost|rate.?limit|quota|timeout|maxCalls|maxTokens" -Path "apps packages"

Add-PhaseNote @"
Checklist de aceite:
- AbortSignal propagado pelo contrato de tools.
- Suite adversarial para secrets, tenant escape, destructive action e prompt override.
- Approval obrigatorio para db-write, email, HTTP mutating, shell/code e pagamentos.
- Budgets de tempo/token/custo por execucao.
"@
Finish-Phase
