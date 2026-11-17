#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_DIR}"

if [[ -z "${VITE_DEV_SERVER_URL:-}" && ! -f "${PROJECT_DIR}/dist/index.html" ]]; then
  npm run build
fi

if [[ -x "${PROJECT_DIR}/node_modules/electron/dist/electron" ]]; then
  ELECTRON_BIN="${PROJECT_DIR}/node_modules/electron/dist/electron"
elif [[ -x "/usr/bin/electron" ]]; then
  ELECTRON_BIN="/usr/bin/electron"
else
  ELECTRON_BIN="$(command -v electron)"
fi

exec "${ELECTRON_BIN}" --class=akkod --ozone-platform-hint=auto "${PROJECT_DIR}" "$@"
