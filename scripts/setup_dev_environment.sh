#!/usr/bin/env bash

# Fuxi EA – developer bootstrap script
# Usage: ./scripts/setup_dev_environment.sh
# This script will:
#   1. Validate Node.js / npm availability.
#   2. Install project dependencies.
#   3. Ensure local environment variables are present.
#   4. Scaffold .fuxi data directories used by mock APIs.
#   5. Install Playwright browsers so e2e specs can be executed immediately.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"

log() {
  printf "\033[1;34m[setup]\033[0m %s\n" "$1"
}

fail() {
  printf "\033[1;31m[setup]\033[0m %s\n" "$1" >&2
  exit 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1. Please install it and re-run."
  fi
}

ensure_node_version() {
  local required_major=18
  local current
  current="$(node -v | sed 's/v//' | cut -d. -f1)"
  if [[ "$current" -lt "$required_major" ]]; then
    fail "Node.js >= ${required_major}.x is required. Found $(node -v)."
  fi
}

create_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    log ".env.local already exists. Skipping creation."
    return
  fi

  cat >"$ENV_FILE" <<'EOF'
# ---- Fuxi EA local defaults ----
FUXI_AUTH_DISABLED=true
NEXT_PUBLIC_GRAPH_ENGINE=reactflow
NEXT_PUBLIC_TELEMETRY_DEBUG=false
NEXT_PUBLIC_AI_SCORING_ENABLED=false
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Provide API tokens if you have them; leave blank for mock mode
# FUXI_API_TOKEN=
# NEXT_PUBLIC_FUXI_API_TOKEN=
EOF
  log "Created .env.local with development defaults."
}

ensure_data_directories() {
  local data_root="$REPO_ROOT/.fuxi/data"
  log "Ensuring .fuxi data directories exist…"
  mkdir -p "$data_root"/{agent,connections,digital-enterprise,harmonized,ingested,projects,sessions,telemetry,transformation}
  touch "$data_root"/telemetry_events.ndjson
  log "Data directories ready under .fuxi/data."
}

install_dependencies() {
  log "Installing npm dependencies…"
  npm install
  log "Installing Playwright browsers…"
  npx playwright install >/dev/null
}

main() {
  cd "$REPO_ROOT"
  log "Bootstrapping development environment inside $REPO_ROOT"

  require_cmd node
  require_cmd npm
  require_cmd npx

  ensure_node_version
  create_env_file
  ensure_data_directories
  install_dependencies

  log "All set! Start the dev server with: npm run dev"
  log "Need fresh data? Delete .fuxi/data and re-run this script."
}

main "$@"
