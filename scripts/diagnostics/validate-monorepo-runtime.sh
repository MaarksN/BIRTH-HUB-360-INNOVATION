#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

log() { echo "[info] $*"; }
warn() { echo "[warn] $*"; }
fail() { echo "[error] $*"; exit 1; }

log "Monorepo runtime validation started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

command -v pnpm >/dev/null 2>&1 || fail "pnpm not found in PATH"
command -v curl >/dev/null 2>&1 || fail "curl not found in PATH"

NODE_VERSION="$(node -v)"
PNPM_VERSION="$(pnpm -v)"
log "node=${NODE_VERSION} pnpm=${PNPM_VERSION}"

if ! node -e "process.exit(Number(process.versions.node.split('.')[0])>=24?0:1)"; then
  warn "Workspace exige Node >=24 e <25. Ambiente atual: ${NODE_VERSION}."
fi

log "Preflight: validando acesso ao registry npm"
if ! curl -I -m 20 https://registry.npmjs.org/typescript >/tmp/birthub_registry_check.log 2>&1; then
  cat /tmp/birthub_registry_check.log
  fail "Sem acesso ao registry npm via proxy/rede. Libere CONNECT HTTPS para registry.npmjs.org:443 antes de rodar novamente."
fi

# Etapa 1 — ambiente limpo
python - <<'PY'
import os
import shutil

for path in ["node_modules", "dist", ".turbo"]:
    if os.path.exists(path):
        shutil.rmtree(path)

for dirpath, dirnames, _ in os.walk('.'):
    if 'node_modules' in dirnames:
        shutil.rmtree(os.path.join(dirpath, 'node_modules'))
        dirnames.remove('node_modules')

print('[ok] cleanup_done')
PY

pnpm store prune

# Etapa 2 — install real
pnpm install

# Etapa 3 — Prisma hard check
pnpm --filter @birthub/database prisma generate

# Etapa 4 — Build full real
pnpm -r build

# Etapa 5 — Typecheck global
pnpm typecheck

# Etapa 6 — Testes reais
pnpm test

echo "[ok] INSTALL: OK"
echo "[ok] BUILD: OK"
echo "[ok] TYPECHECK: OK"
echo "[ok] TESTS: OK"
echo "[ok] RUNTIME: VALIDADO"
echo "[ok] MONOREPO: PRODUCAO READY"
