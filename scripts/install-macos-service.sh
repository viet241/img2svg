#!/usr/bin/env bash
set -euo pipefail

SERVICE_LABEL="com.img2svg.web"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLIST_TEMPLATE="${PROJECT_DIR}/launchd/${SERVICE_LABEL}.plist.template"
LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
PLIST_TARGET="${LAUNCH_AGENTS_DIR}/${SERVICE_LABEL}.plist"
LOG_DIR="${PROJECT_DIR}/logs"
NODE_BIN_DIR="$(dirname "$(command -v node)")"

if [[ ! -f "${PLIST_TEMPLATE}" ]]; then
    echo "Missing plist template: ${PLIST_TEMPLATE}" >&2
    exit 1
fi

if [[ ! -f "${PROJECT_DIR}/dist/index.html" ]]; then
    echo "Production build not found. Run: pnpm run build" >&2
    exit 1
fi

mkdir -p "${LAUNCH_AGENTS_DIR}"
mkdir -p "${LOG_DIR}"

sed \
    -e "s|__PROJECT_DIR__|${PROJECT_DIR}|g" \
    -e "s|__NODE_BIN_DIR__|${NODE_BIN_DIR}|g" \
    "${PLIST_TEMPLATE}" > "${PLIST_TARGET}"

chmod +x "${PROJECT_DIR}/scripts/run-service.sh"

if launchctl print "gui/$(id -u)/${SERVICE_LABEL}" >/dev/null 2>&1; then
    launchctl bootout "gui/$(id -u)" "${PLIST_TARGET}" || true
fi

launchctl bootstrap "gui/$(id -u)" "${PLIST_TARGET}"
launchctl enable "gui/$(id -u)/${SERVICE_LABEL}"

: > "${LOG_DIR}/service.out.log"
: > "${LOG_DIR}/service.err.log"

launchctl kickstart -k "gui/$(id -u)/${SERVICE_LABEL}"

echo "Installed and started service: ${SERVICE_LABEL}"
echo "Status: launchctl print gui/$(id -u)/${SERVICE_LABEL}"
echo "URL: http://localhost:${PORT:-7771}"
echo "Logs: ${LOG_DIR}/service.out.log"
