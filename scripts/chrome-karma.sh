#!/usr/bin/env bash
set -euo pipefail

browser="${PLAYWRIGHT_CHROME_BIN:-$HOME/.cache/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell}"
args=()
for arg in "$@"; do
  case "$arg" in
    --remote-debugging-port=*) ;;
    *) args+=("$arg") ;;
  esac
done
exec "$browser" "${args[@]}"
