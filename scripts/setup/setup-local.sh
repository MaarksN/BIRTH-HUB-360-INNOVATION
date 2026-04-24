#!/usr/bin/env bash
set -euo pipefail

if ! command -v corepack >/dev/null 2>&1; then
  echo "corepack is required to bootstrap pnpm automatically."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to start postgres and redis."
  exit 1
fi

corepack enable >/dev/null 2>&1 || true

wait_for_compose_health() {
  local service="$1"
  local timeout_seconds="${2:-90}"
  local started_at
  started_at="$(date +%s)"

  while true; do
    local container_id
    container_id="$(docker compose ps -q "${service}")"

    if [[ -n "${container_id}" ]]; then
      local status
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"

      if [[ "${status}" == "healthy" ]]; then
        echo "[setup:local] ${service} is healthy"
        return 0
      fi
    fi

    if (( "$(date +%s)" - started_at >= timeout_seconds )); then
      echo "[setup:local] timed out waiting for ${service} health after ${timeout_seconds}s" >&2
      docker compose logs --tail=50 "${service}" >&2 || true
      return 1
    fi

    sleep 2
  done
}

pnpm install --frozen-lockfile
docker compose up -d postgres redis
wait_for_compose_health postgres 90
wait_for_compose_health redis 60
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
