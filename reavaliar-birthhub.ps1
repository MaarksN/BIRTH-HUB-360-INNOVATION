# ==========================================
# BIRTH-HUB 360 - REAVALIAÇÃO COMPLETA
# ==========================================

$ErrorActionPreference = "Continue"

$repoPath = "C:\Users\Marks\Documents\GitHub\BIRTH-HUB-360-INNOVATION"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $repoPath "reavaliacao_$timestamp.log"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==================================================" -ForegroundColor DarkCyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor DarkCyan
    Add-Content -Path $logFile -Value "`n=================================================="
    Add-Content -Path $logFile -Value $Message
    Add-Content -Path $logFile -Value "=================================================="
}

function Run-Command {
    param(
        [string]$Label,
        [string]$Command
    )

    Write-Host "`n[$Label]" -ForegroundColor Yellow
    Write-Host $Command -ForegroundColor Gray

    Add-Content -Path $logFile -Value "`n[$Label]"
    Add-Content -Path $logFile -Value $Command

    try {
        Invoke-Expression "$Command *>&1" | Tee-Object -FilePath $logFile -Append
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-Host "✅ $Label concluído" -ForegroundColor Green
            Add-Content -Path $logFile -Value "STATUS: OK"
        }
        else {
            Write-Host "❌ $Label falhou com exit code $LASTEXITCODE" -ForegroundColor Red
            Add-Content -Path $logFile -Value "STATUS: FAIL (exit code $LASTEXITCODE)"
        }
    }
    catch {
        Write-Host "❌ $Label gerou exceção: $($_.Exception.Message)" -ForegroundColor Red
        Add-Content -Path $logFile -Value "STATUS: EXCEPTION"
        Add-Content -Path $logFile -Value $_.Exception.ToString()
    }
}

# ==========================================
# INÍCIO
# ==========================================

if (-not (Test-Path $repoPath)) {
    Write-Host "❌ Caminho do repositório não encontrado: $repoPath" -ForegroundColor Red
    exit 1
}

New-Item -ItemType File -Force -Path $logFile | Out-Null

Write-Step "INICIANDO REAVALIAÇÃO COMPLETA DO MONOREPO"
Set-Location $repoPath

Write-Host "Repositório: $repoPath" -ForegroundColor White
Write-Host "Log: $logFile" -ForegroundColor White

Add-Content -Path $logFile -Value "Repositório: $repoPath"
Add-Content -Path $logFile -Value "Log: $logFile"
Add-Content -Path $logFile -Value "Data/Hora: $(Get-Date)"

# ==========================================
# INFO DE AMBIENTE
# ==========================================

Write-Step "COLETANDO INFORMAÇÕES DE AMBIENTE"
Run-Command -Label "Node version" -Command "node -v"
Run-Command -Label "PNPM version" -Command "pnpm -v"
Run-Command -Label "Git branch/status" -Command "git status --short --branch"

# ==========================================
# INSTALAÇÃO
# ==========================================

Write-Step "INSTALANDO DEPENDÊNCIAS"
Run-Command -Label "pnpm install" -Command "pnpm install"

# ==========================================
# PRISMA CLIENT
# ==========================================

Write-Step "GERANDO PRISMA CLIENT"
Run-Command -Label "db:generate" -Command "pnpm --filter @birthub/database db:generate"

# ==========================================
# DETECÇÃO DE DOCKER
# ==========================================

Write-Step "VERIFICANDO DOCKER / INFRA"
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
$dockerComposeLegacy = Get-Command docker-compose -ErrorAction SilentlyContinue

if ($dockerCmd) {
    Run-Command -Label "docker version" -Command "docker --version"

    if (Test-Path (Join-Path $repoPath "docker-compose.yml")) {
        Run-Command -Label "docker compose up" -Command "docker compose up -d"
    }
    elseif (Test-Path (Join-Path $repoPath "compose.yml")) {
        Run-Command -Label "docker compose up" -Command "docker compose up -d"
    }
    else {
        Write-Host "⚠️ Nenhum arquivo docker-compose.yml/compose.yml encontrado no root." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "WARN: Nenhum arquivo docker-compose.yml/compose.yml encontrado."
    }
}
elseif ($dockerComposeLegacy) {
    Run-Command -Label "docker-compose version" -Command "docker-compose --version"

    if (Test-Path (Join-Path $repoPath "docker-compose.yml")) {
        Run-Command -Label "docker-compose up" -Command "docker-compose up -d"
    }
    else {
        Write-Host "⚠️ docker-compose existe, mas docker-compose.yml não foi encontrado no root." -ForegroundColor Yellow
        Add-Content -Path $logFile -Value "WARN: docker-compose existe, mas docker-compose.yml não encontrado."
    }
}
else {
    Write-Host "⚠️ Docker não encontrado. As etapas de banco dependentes de container podem falhar." -ForegroundColor Yellow
    Add-Content -Path $logFile -Value "WARN: Docker não encontrado."
}

Start-Sleep -Seconds 5

# ==========================================
# MIGRATIONS / DB CHECKS
# ==========================================

Write-Step "TENTANDO APLICAR MIGRATIONS / VALIDAR BANCO"

Run-Command -Label "Prisma migrate deploy" -Command "pnpm --filter @birthub/database exec prisma migrate deploy --schema prisma/schema.prisma"
Run-Command -Label "Prisma validate" -Command "pnpm --filter @birthub/database exec prisma validate --schema prisma/schema.prisma"

# ==========================================
# SEED
# ==========================================

Write-Step "RODANDO SEED"
Run-Command -Label "db:seed" -Command "pnpm --filter @birthub/database db:seed"

# ==========================================
# TYPECHECK
# ==========================================

Write-Step "TYPECHECK GLOBAL"
Run-Command -Label "pnpm typecheck" -Command "pnpm typecheck"

# ==========================================
# LINT
# ==========================================

Write-Step "LINT GLOBAL"
Run-Command -Label "pnpm lint" -Command "pnpm lint"

# ==========================================
# BUILD
# ==========================================

Write-Step "BUILD GLOBAL"
Run-Command -Label "pnpm build" -Command "pnpm build"

# ==========================================
# TESTES
# ==========================================

Write-Step "TESTES"
Run-Command -Label "Database test" -Command "pnpm --filter @birthub/database test"
Run-Command -Label "Database isolation test" -Command "pnpm --filter @birthub/database test:isolation"
Run-Command -Label "Monorepo test" -Command "pnpm test"

# ==========================================
# RESUMO FINAL
# ==========================================

Write-Step "REAVALIAÇÃO FINALIZADA"
Write-Host "✅ Script concluído. Revise o log em:" -ForegroundColor Green
Write-Host $logFile -ForegroundColor White