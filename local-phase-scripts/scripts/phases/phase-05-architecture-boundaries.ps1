param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-05" -PhaseName "Arquitetura e boundaries" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: modulos grandes, ciclos e boundaries."
Invoke-OptionalTool -Tool "depcruise" -Step "dependency-cruiser" -Command "depcruise apps packages" -InstallHint "npm i -D dependency-cruiser ou pnpm dlx dependency-cruiser."
Invoke-PhaseCommand -Step "local-cycle-detector" -Command "node `"$PSScriptRoot\..\tools\detect-cycles.mjs`" apps packages" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "large-source-files" -Command "Get-ChildItem apps,packages -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx | Where-Object { `$_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.turbo\\|\\imports\\' } | ForEach-Object { `$lines=(Get-Content `$_.FullName -ErrorAction SilentlyContinue).Count; [pscustomobject]@{Lines=`$lines; File=`$_.FullName.Substring((Get-Location).Path.Length+1)} } | Sort-Object Lines -Descending | Select-Object -First 40 | Format-Table -AutoSize" -AllowFail | Out-Null
Invoke-RgOrSkip -Step "boundary-hotspots" -Pattern "from ['\"]\.\./|from ['\"]\.\./\.\./|controller|service|repository|domain|infra|adapter|policy|runtime" -Path "apps packages"
Invoke-PhaseCommand -Step "eslint-boundaries" -Command "pnpm exec eslint ." -AllowFail | Out-Null

Add-PhaseNote @"
Checklist de aceite:
- Regras de dependencia criadas.
- Contratos extraidos antes de quebrar modulos grandes.
- Controller/service/domain/infra separados nos fluxos de maior risco.
- Ciclos removidos ou documentados.
"@
Finish-Phase
