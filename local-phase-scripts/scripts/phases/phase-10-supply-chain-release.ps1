param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-10" -PhaseName "Supply chain CI CD release e documentacao" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-022, TD-023, TD-024, TD-025, TD-026, TD-033, TD-034."
Invoke-PhaseCommand -Step "pnpm-audit-low" -Command "pnpm audit --audit-level low" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "pnpm-outdated" -Command "pnpm outdated -r --long" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "github-actions-unpinned" -Pattern "uses: .+@master|uses: .+@main|uses: .+@v[0-9]+|docker://[^@]+$|curl .*gitleaks|semgrep/semgrep" -Path ".github"
Invoke-RgOrSkip -Step "images-without-digest-or-latest" -Pattern "image:.*:latest|FROM\s+[^@]+:|ghcr\.io/.+:latest|node:.*alpine" -Path "."
Invoke-PhaseCommand -Step "dependabot-renovate-present" -Command "Get-ChildItem -Force -Recurse -File -Include dependabot.yml,renovate.json,.renovaterc* -ErrorAction SilentlyContinue | Select-Object FullName" -AllowFail | Out-Null
Invoke-OptionalTool -Tool "syft" -Step "sbom-syft" -Command "syft . -o cyclonedx-json" -InstallHint "Instale syft para gerar SBOM."
Invoke-OptionalTool -Tool "grype" -Step "grype-scan" -Command "grype ." -InstallHint "Instale grype para scan de vulnerabilidades."
Invoke-OptionalTool -Tool "actionlint" -Step "actionlint" -Command "actionlint" -InstallHint "Instale actionlint para validar workflows."
Invoke-OptionalTool -Tool "zizmor" -Step "zizmor-workflows" -Command "zizmor .github/workflows" -InstallHint "Instale zizmor para security lint de GitHub Actions."

Add-PhaseNote @"
Checklist de aceite:
- Actions pinadas por SHA.
- Imagens pinadas por digest.
- Checksums de binarios baixados.
- Renovate/Dependabot criado.
- SBOM artifact e policy de bloqueio por severidade.
"@
Finish-Phase
