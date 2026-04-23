#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-production}"
TAG="${2:-v1.0.0}"
ROLLBACK_NOTES="${3:-}"

if [[ "${TARGET_ENV}" != "production" && "${TARGET_ENV}" != "staging" ]]; then
  echo "invalid target: ${TARGET_ENV}. use production|staging" >&2
  exit 1
fi

if [[ ! "${TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "invalid semantic tag: ${TAG}" >&2
  exit 1
fi

echo "[rollback] target=${TARGET_ENV} tag=${TAG}"

git fetch --tags --quiet
if ! git rev-parse --verify --quiet "refs/tags/${TAG}" >/dev/null; then
  echo "tag not found: ${TAG}" >&2
  exit 1
fi

git checkout --force "${TAG}"
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm release:bundle
corepack pnpm "release:preflight:${TARGET_ENV}"
corepack pnpm release:smoke

if [[ -n "${ROLLBACK_NOTES}" ]]; then
  corepack pnpm release:rollback:evidence:auto --target="${TARGET_ENV}" --notes="${ROLLBACK_NOTES}"
else
  corepack pnpm release:rollback:evidence:auto --target="${TARGET_ENV}"
fi

echo "[rollback] automated rehearsal completed for ${TAG}"
