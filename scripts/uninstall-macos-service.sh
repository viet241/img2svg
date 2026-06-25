#!/usr/bin/env bash
set -euo pipefail

SERVICE_LABEL="com.img2svg.web"
PLIST_TARGET="${HOME}/Library/LaunchAgents/${SERVICE_LABEL}.plist"

if launchctl print "gui/$(id -u)/${SERVICE_LABEL}" >/dev/null 2>&1; then
    launchctl bootout "gui/$(id -u)" "${PLIST_TARGET}" || true
fi

launchctl disable "gui/$(id -u)/${SERVICE_LABEL}" || true
rm -f "${PLIST_TARGET}"

echo "Uninstalled service: ${SERVICE_LABEL}"
