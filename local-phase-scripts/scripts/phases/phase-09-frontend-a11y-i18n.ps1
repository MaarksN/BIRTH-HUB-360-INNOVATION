param(
  [string]$RepoRoot = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION",
  [string]$ReportRoot = ""
)
. "$PSScriptRoot\..\lib\common.ps1"
Initialize-Phase -PhaseId "fase-09" -PhaseName "Frontend UX acessibilidade e i18n" -RepoRoot $RepoRoot -ReportRoot $ReportRoot
Assert-GitRepo

Add-PhaseNote "Escopo: TD-008, TD-035, TD-036, TD-037."
Invoke-PhaseCommand -Step "web-tests" -Command "pnpm --filter @birthub/web test" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "manual-web-node-tests" -Command "node --import tsx --test apps/web/tests/*.test.ts" -AllowFail | Out-Null
Invoke-PhaseCommand -Step "playwright-tests" -Command "pnpm exec playwright test" -AllowFail | Out-Null
Invoke-OptionalTool -Tool "lighthouse" -Step "lighthouse-localhost" -Command "lighthouse http://localhost:3001 --view" -InstallHint "npm i -g lighthouse; exige app rodando em localhost:3001."
Invoke-RgOrSkip -Step "a11y-jsx-surface" -Pattern "<button|<input|<select|<textarea|aria-|role=|htmlFor=|label" -Path "apps/web"
Invoke-RgOrSkip -Step "destructive-actions-ui" -Pattern "Cancelar|Replay|Excluir|Delete|Cancel|Archive|confirm|modal|disabled|loading|aria-live" -Path "apps/web"
Invoke-RgOrSkip -Step "i18n-hardcoded-locale" -Pattern "Revenue OS|Central de Operacao|Operations Hub|toLocale|Intl\.|pt-BR|en-US|t\(" -Path "apps/web"

Add-PhaseNote @"
Checklist de aceite:
- i18n alinhado com contrato de produto.
- Zero violacoes a11y criticas.
- Confirmacao, motivo e disabled state para acoes destrutivas.
- Loading/error/empty states cobertos.
"@
Finish-Phase
