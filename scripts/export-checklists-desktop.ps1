param(
  [string]$TargetDir = 'C:\Users\Marks\Desktop',
  [switch]$GenerateZip
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $repoRoot 'docs\product'

$files = @(
  'AUDITORIA_IA_EXECUCAO_CHECKLISTS_2026-04-04.md',
  'AUDITORIA_STATUS_CONCLUIDO_2026-04-04.md',
  'AUDITORIA_STATUS_NAO_INICIADO_2026-04-04.md',
  'AUDITORIA_STATUS_PRECISA_MELHORIAS_2026-04-04.md',
  'CHECKLIST_1900_PLUS_COM_PROMPTS_2026-04-04.md',
  'CHECKLIST_200_ITENS_LANCAMENTO_2026-04-04.md',
  'CHECKLIST_200_PLUS_COM_PROMPTS_2026-04-04.md',
  'RELATORIO_DIVIDA_TECNICA_ROADMAP_LANCAMENTO_2026-04-04.md'
)

if (-not (Test-Path -LiteralPath $TargetDir)) {
  New-Item -Path $TargetDir -ItemType Directory -Force | Out-Null
}

Write-Host "Exportando arquivos para: $TargetDir"

foreach ($file in $files) {
  $src = Join-Path $sourceDir $file
  $dst = Join-Path $TargetDir $file

  if (-not (Test-Path -LiteralPath $src)) {
    throw "Arquivo de origem não encontrado: $src"
  }

  Copy-Item -LiteralPath $src -Destination $dst -Force
  Write-Host "OK -> $dst"
}

if ($GenerateZip) {
  $zipPath = Join-Path $TargetDir 'PACOTE_CHECKLISTS_PROMPTS_2026-04-04.zip'
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  $zipInputs = $files | ForEach-Object { Join-Path $TargetDir $_ }
  Compress-Archive -Path $zipInputs -DestinationPath $zipPath -CompressionLevel Optimal
  Write-Host "ZIP gerado localmente: $zipPath"
}

Write-Host 'Exportação concluída com sucesso.'
