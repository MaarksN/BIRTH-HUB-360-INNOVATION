param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-03" -PhaseName "Typecheck lint dead code e qualidade base" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-004, TD-005, TD-017, TD-018, TD-019."
Invoke-PhaseCommand -Step "typecheck-global" -Command "pnpm exec tsc -p tsconfig.json --noEmit --incremental false" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "eslint-global" -Command "pnpm exec eslint ." -AllowFail | Out-Null
Invoke-RgOrSkip -Step "typing-debt-patterns" -Pattern "\bany\b|as any|@ts-ignore|@ts-expect-error|Record<string,\s*any>|JSON\.parse\(" -Path "apps packages scripts"
Invoke-RgOrSkip -Step "todo-fixme-hack" -Pattern "TODO|FIXME|HACK|XXX" -Path "apps packages scripts"
Invoke-PhaseCommand -Step "local-cycle-detector" -Command "node `"$PSScriptRoot\..\tools\detect-cycles.mjs`" apps packages" -AllowFail | Out-Null
Invoke-OptionalTool -Tool "madge" -Step "madge-circular" -Command "madge --circular apps packages" -InstallHint "npm i -D madge ou pnpm dlx madge."
Invoke-OptionalTool -Tool "jscpd" -Step "jscpd-duplication" -Command "jscpd apps packages --min-lines 20" -InstallHint "npm i -D jscpd ou pnpm dlx jscpd."
Invoke-OptionalTool -Tool "knip" -Step "knip-dead-code" -Command "pnpm exec knip" -InstallHint "Se ja estiver no package.json, rode pnpm install."

Add-PhaseNote @"
Checklist de aceite:
- Typecheck verde.
- Novas supressoes bloqueadas ou justificadas.
- Ciclos removidos ou allowlist documentada.
- Politica para imports/ registrada.
"@
Finish-Phase
