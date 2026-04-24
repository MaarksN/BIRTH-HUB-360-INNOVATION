#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_ORIGIN_PATH="${ROOT_DIR}/.git/local-origin.git"

if git -C "${ROOT_DIR}" remote get-url origin >/dev/null 2>&1; then
  echo "origin already configured: $(git -C "${ROOT_DIR}" remote get-url origin)"
  exit 0
fi

mkdir -p "${LOCAL_ORIGIN_PATH}"
if [[ ! -f "${LOCAL_ORIGIN_PATH}/HEAD" ]]; then
  git init --bare "${LOCAL_ORIGIN_PATH}" >/dev/null
fi
git --git-dir="${LOCAL_ORIGIN_PATH}" config receive.shallowUpdate true

git -C "${ROOT_DIR}" remote add origin "${LOCAL_ORIGIN_PATH}"
echo "origin configured at ${LOCAL_ORIGIN_PATH}"
