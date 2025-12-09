#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC_PATH="$REPO_ROOT/docs/recovery_playbook.md"
DATA_ROOT="$REPO_ROOT/.fuxi/data"
BEANS_CMD="npm run beans"

section() {
  printf "\n\033[1;32m== %s ==\033[0m\n" "$1"
}

note() {
  printf "  • %s\n" "$1"
}

warn() {
  printf "\033[1;33m[warn]\033[0m %s\n" "$1"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    warn "Missing $1 — run scripts/setup_dev_environment.sh first."
  fi
}

section "Repository snapshot"
( cd "$REPO_ROOT" && {
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  REV=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  note "Path: $REPO_ROOT"
  note "Branch: $BRANCH@$REV"
  note "Working tree:"
  git status -sb || true
})

section "Environment quick check"
require_cmd node
require_cmd npm
require_cmd npx
if command -v node >/dev/null 2>&1; then
  note "Node $(node -v)";
fi
if [[ -f "$REPO_ROOT/.env.local" ]]; then
  note "Using .env.local"
else
  warn ".env.local not found. scripts/setup_dev_environment.sh can scaffold defaults."
fi

section "Telemetry files"
mkdir -p "$DATA_ROOT"
touch "$DATA_ROOT/telemetry_events.ndjson"
note "events log: $DATA_ROOT/telemetry_events.ndjson"
ls -1 "$DATA_ROOT" | sed 's/^/    - /'

section "Quick command deck"
cat <<'EOT'
1. npm install                     # install dependencies
2. npm run dev                     # start Next.js dev server
3. npm run beans                   # list curated commands (dev:nuke, playwright, telemetry)
4. npx playwright test             # run complete e2e suite
5. npm run dev:nuke                # restart dev server + clear cache
6. node scripts/telemetry-summary.js # summarize latest telemetry
EOT

section "Beans snapshot"
( cd "$REPO_ROOT" && $BEANS_CMD ) || warn "npm run beans failed"

section "Reference docs"
if [[ -f "$DOC_PATH" ]]; then
  head -n 80 "$DOC_PATH"
else
  warn "docs/recovery_playbook.md missing"
fi

section "Next steps"
note "Start dev server: npm run dev"
note "Visit /project/700am/experience?scene=command for sanity"
note "Run npx playwright test before shipping changes"
