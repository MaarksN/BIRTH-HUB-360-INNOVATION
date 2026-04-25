Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

function Initialize-Phase {
  param(
    [Parameter(Mandatory=$true)][string]$PhaseId,
    [Parameter(Mandatory=$true)][string]$PhaseName,
    [Parameter(Mandatory=$true)][string]$RepoRoot,
    [string]$ReportRoot = ""
  )

  $script:PhaseId = $PhaseId
  $script:PhaseName = $PhaseName
  try {
    $script:RepoRoot = Convert-Path -LiteralPath $RepoRoot -ErrorAction Stop
  } catch {
    Write-Host "ERRO: RepoRoot nao encontrado: $RepoRoot" -ForegroundColor Red
    exit 2
  }

  if ([string]::IsNullOrWhiteSpace($ReportRoot)) {
    $ReportRoot = Join-Path $script:RepoRoot "artifacts\local-remediation"
  }

  $safeName = ($PhaseName -replace '[^a-zA-Z0-9\-]+','-').Trim('-').ToLowerInvariant()
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $script:ReportDir = Join-Path $ReportRoot "$PhaseId-$safeName-$stamp"
  New-Item -ItemType Directory -Force -Path $script:ReportDir | Out-Null

  $script:CommandLog = Join-Path $script:ReportDir "commands.log"
  $script:SummaryMd = Join-Path $script:ReportDir "summary.md"
  $script:StatusCsv = Join-Path $script:ReportDir "status.csv"

  "# $PhaseId - $PhaseName`n" | Set-Content -Encoding UTF8 $script:SummaryMd
  "Data: $(Get-Date -Format o)`n" | Add-Content -Encoding UTF8 $script:SummaryMd
  "Repositorio: $script:RepoRoot`n" | Add-Content -Encoding UTF8 $script:SummaryMd
  "| Step | Status | ExitCode | Comando |`n| --- | --- | ---: | --- |" | Add-Content -Encoding UTF8 $script:SummaryMd
  "step,status,exitCode,command" | Set-Content -Encoding UTF8 $script:StatusCsv

  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host "$PhaseId - $PhaseName" -ForegroundColor Cyan
  Write-Host "Repo: $script:RepoRoot"
  Write-Host "Relatorio: $script:ReportDir"
  Write-Host "============================================================" -ForegroundColor Cyan
}

function Add-PhaseNote {
  param([string]$Text)
  "`n$Text" | Add-Content -Encoding UTF8 $script:SummaryMd
  Write-Host $Text
}

function Test-Tool {
  param([Parameter(Mandatory=$true)][string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  return [bool]$cmd
}

function Invoke-PhaseCommand {
  param(
    [Parameter(Mandatory=$true)][string]$Step,
    [Parameter(Mandatory=$true)][string]$Command,
    [switch]$Optional,
    [switch]$AllowFail
  )

  Push-Location $script:RepoRoot
  try {
    $header = "`n>>> [$Step] $Command`n"
    $header | Tee-Object -FilePath $script:CommandLog -Append | Out-Null
    Write-Host ""
    Write-Host "[$Step]" -ForegroundColor Yellow
    Write-Host $Command

    $outFile = Join-Path $script:ReportDir (($Step -replace '[^a-zA-Z0-9\-]+','-') + ".log")
    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
    $output = & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCommand 2>&1
    $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }

    $output | Tee-Object -FilePath $outFile | Out-Null
    $output | Tee-Object -FilePath $script:CommandLog -Append | Out-Null

    $status = "OK"
    if ($exitCode -ne 0) {
      if ($Optional -or $AllowFail) { $status = "WARN" } else { $status = "FAIL" }
    }

    $escapedCommand = $Command.Replace("|","\|")
    "| $Step | $status | $exitCode | ``$escapedCommand`` |" | Add-Content -Encoding UTF8 $script:SummaryMd
    '"' + $Step.Replace('"','""') + '","' + $status + '",' + $exitCode + ',"' + $Command.Replace('"','""') + '"' | Add-Content -Encoding UTF8 $script:StatusCsv

    if ($status -eq "FAIL") {
      Write-Host "FALHOU: $Step. Veja $outFile" -ForegroundColor Red
    } elseif ($status -eq "WARN") {
      Write-Host "AVISO: $Step terminou com codigo $exitCode. Veja $outFile" -ForegroundColor DarkYellow
    } else {
      Write-Host "OK: $Step" -ForegroundColor Green
    }
    return $exitCode
  }
  finally {
    Pop-Location
  }
}

function Invoke-OptionalTool {
  param(
    [Parameter(Mandatory=$true)][string]$Tool,
    [Parameter(Mandatory=$true)][string]$Step,
    [Parameter(Mandatory=$true)][string]$Command,
    [string]$InstallHint = ""
  )

  if (Test-Tool $Tool) {
    Invoke-PhaseCommand -Step $Step -Command $Command -AllowFail
  } else {
    $msg = "SKIP: ferramenta '$Tool' nao encontrada. $InstallHint"
    Write-Host $msg -ForegroundColor DarkYellow
    $msg | Add-Content -Encoding UTF8 $script:CommandLog
    "| $Step | SKIP | 127 | ``$msg`` |" | Add-Content -Encoding UTF8 $script:SummaryMd
    '"' + $Step.Replace('"','""') + '","SKIP",127,"' + $msg.Replace('"','""') + '"' | Add-Content -Encoding UTF8 $script:StatusCsv
  }
}

function Finish-Phase {
  Add-PhaseNote "`nRelatorios gerados em: $script:ReportDir"
  Write-Host ""
  Write-Host "Concluido. Abra:" -ForegroundColor Cyan
  Write-Host "  $script:SummaryMd"
  Write-Host "  $script:CommandLog"
}

function Assert-GitRepo {
  Invoke-PhaseCommand -Step "baseline-git-status" -Command "git status --short" -AllowFail | Out-Null
  Invoke-PhaseCommand -Step "baseline-branch" -Command "git branch --show-current" -AllowFail | Out-Null
}

function Invoke-RgOrSkip {
  param([string]$Step, [string]$Pattern, [string]$Path = ".")
  if (Test-Tool "rg") {
    $cmd = "rg -n --hidden --glob '!node_modules' --glob '!.next' --glob '!.turbo' --glob '!imports' `"$Pattern`" $Path"
    Invoke-PhaseCommand -Step $Step -Command $cmd -AllowFail | Out-Null
  } else {
    $cmd = "Get-ChildItem -Recurse -File -Force | Where-Object { `$_.FullName -notmatch '\\node_modules\\|\\.next\\|\\.turbo\\|\\imports\\' } | Select-String -Pattern `"$Pattern`" -CaseSensitive:`$false"
    Invoke-PhaseCommand -Step $Step -Command $cmd -AllowFail | Out-Null
  }
}


