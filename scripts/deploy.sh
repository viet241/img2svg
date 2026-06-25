#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_LABEL="com.img2svg.web"

cd "${PROJECT_DIR}"

pnpm run build

if launchctl print "gui/$(id -u)/${SERVICE_LABEL}" >/dev/null 2>&1; then
    bash "${PROJECT_DIR}/scripts/restart-macos-service.sh"
else
    bash "${PROJECT_DIR}/scripts/install-macos-service.sh"
fi

echo "Deploy complete."
