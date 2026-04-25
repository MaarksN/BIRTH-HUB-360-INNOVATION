param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-00" -PhaseName "Seguranca critica e vazamento de dados" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-001, TD-002, TD-003, TD-015, parte de TD-022/TD-023."
Invoke-PhaseCommand -Step "env-tracked-files" -Command "git ls-files .env .env.local .env.example .env.vps.example ops/release/sealed/*" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "secret-like-patterns" -Pattern "DATABASE_URL|SECRET|TOKEN|PRIVATE_KEY|api_secret|api_token|access_token=|password=|Authorization|Bearer" -Path "."
Invoke-RgOrSkip -Step "tokens-in-query-string" -Pattern "access_token=|api_token=|api_secret|token=\$\{|[?&](token|api_key|apiSecret|api_secret)=" -Path "apps packages"
Invoke-RgOrSkip -Step "trusted-context-bypass" -Pattern "trustedContext|skip.*signature|signature.*skip|verify.*signature" -Path "apps packages"
Invoke-RgOrSkip -Step "k8s-secret-stringdata-latest" -Pattern "stringData:|:latest|image:" -Path "k8s infra .github"
Invoke-OptionalTool -Tool "gitleaks" -Step "gitleaks-history" -Command "gitleaks detect --source . --redact --no-banner" -InstallHint "Instale pelo winget/scoop ou use container oficial."
Invoke-OptionalTool -Tool "trufflehog" -Step "trufflehog-verified" -Command "trufflehog git file://. --only-verified" -InstallHint "Instale pelo winget/scoop ou use container oficial."
Invoke-PhaseCommand -Step "pnpm-audit-low" -Command "pnpm audit --audit-level low" -AllowFail | Out-Null

Add-PhaseNote @"
Checklist manual obrigatorio:
- Rotacionar credenciais reais que aparecerem em historico Git.
- Remover tokens de URL e passar para Authorization/body quando a API permitir.
- Revisar todas as rotas que alimentam trustedContext.
- Pinning emergencial dos scanners/actions mais sensiveis.
"@
Finish-Phase
