#!/usr/bin/env bash
set -euo pipefail

SERVICE_LABEL="com.img2svg.web"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"

if ! launchctl print "gui/$(id -u)/${SERVICE_LABEL}" >/dev/null 2>&1; then
    echo "Service is not loaded: ${SERVICE_LABEL}" >&2
    echo "Run: pnpm run service:install" >&2
    exit 1
fi

mkdir -p "${LOG_DIR}"
: > "${LOG_DIR}/service.out.log"
: > "${LOG_DIR}/service.err.log"

launchctl kickstart -k "gui/$(id -u)/${SERVICE_LABEL}"
echo "Restarted service: ${SERVICE_LABEL}"
