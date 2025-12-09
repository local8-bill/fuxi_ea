#!/usr/bin/env bash
set -euo pipefail

# Detect primary LAN IP (prefers en0/en1 on macOS; falls back to hostname/IP methods)
get_ip() {
  if command -v ipconfig >/dev/null 2>&1; then
    ipconfig getifaddr en0 2>/dev/null && return 0
    ipconfig getifaddr en1 2>/dev/null && return 0
  fi
  if command -v hostname >/dev/null 2>&1; then
    hostname -I 2>/dev/null | awk '{print $1}' && return 0
  fi
  if command -v ip >/dev/null 2>&1; then
    ip addr show | awk '/inet / && $2 !~ /^127/ { sub(/\/.*/, "", $2); print $2; exit }' && return 0
  fi
  echo "localhost"
}

LAN_IP="$(get_ip)"

echo "🌐 Starting Next dev server on 0.0.0.0"
echo "➡️  From another device on the same network, open: http://${LAN_IP}:3000"
echo "⚠️  Approve the macOS firewall prompt for port 3000 if it appears."

exec next dev --hostname 0.0.0.0 "$@"
