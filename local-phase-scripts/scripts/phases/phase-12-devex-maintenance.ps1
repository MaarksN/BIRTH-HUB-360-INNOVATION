param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-12" -PhaseName "Developer experience e manutencao continua" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-006, TD-007, TD-027, TD-028, TD-039."
Invoke-PhaseCommand -Step "node-version" -Command "node -v" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "pnpm-version" -Command "pnpm -v" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "package-engines-nvmrc" -Command "Get-Content package.json, .nvmrc, README.md -ErrorAction SilentlyContinue | Select-String -Pattern 'node|pnpm|engines|24|20' -CaseSensitive:`$false" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "non-cross-platform-scripts" -Pattern "sh -c|find .*-name|rm -rf|cp -r|export\s+[A-Z_]+=" -Path "package.json apps packages scripts"
Invoke-PhaseCommand -Step "turbo-side-effects" -Command "Get-Content turbo.json -ErrorAction SilentlyContinue" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "pnpm-check" -Command "pnpm check" -AllowFail | Out-Null
Invoke-OptionalTool -Tool "semgrep" -Step "semgrep-version" -Command "semgrep --version" -InstallHint "Instale semgrep ou rode via Docker/devcontainer."
Invoke-OptionalTool -Tool "gitleaks" -Step "gitleaks-version" -Command "gitleaks version" -InstallHint "Instale gitleaks."
Invoke-OptionalTool -Tool "trufflehog" -Step "trufflehog-version" -Command "trufflehog --version" -InstallHint "Instale trufflehog."
Invoke-OptionalTool -Tool "syft" -Step "syft-version" -Command "syft version" -InstallHint "Instale syft."
Invoke-OptionalTool -Tool "grype" -Step "grype-version" -Command "grype version" -InstallHint "Instale grype."

Add-PhaseNote @"
Checklist de aceite:
- Setup novo reproduzivel.
- Comandos locais equivalentes ao CI.
- pnpm check sem side effects perigosos.
- Toolchain documentada via devcontainer ou scripts versionados.
- Auditoria recorrente planejada.
"@
Finish-Phase
