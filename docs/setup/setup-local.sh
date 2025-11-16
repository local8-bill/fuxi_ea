#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(pwd)
if [[ ! -f package.json ]]; then
  echo "ERROR: Run this script from the root of fuxi_ea (package.json not found)."
  exit 1
fi

if [[ -t 1 ]]; then
  USE_COLOR=1
fi

function prompt_yes_no() {
  local prompt="$1"
  local default=${2:-Y}
  read -rp "$prompt [$default] " answer
  answer=${answer:-$default}
  [[ "$answer" =~ ^[Yy] ]];
}

echo "🔧 Fuxi EA environment helper"

if prompt_yes_no "Install Xcode command line tools?"; then
  xcode-select --install || true
fi

if ! command -v brew >/dev/null 2>&1; then
  if prompt_yes_no "Install Homebrew (needed for Node 20)?"; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  else
    echo "⚠️  Homebrew is required to install Node 20. Install it manually and rerun this script."
    exit 1
  fi
fi

if prompt_yes_no "Install or ensure Node 20 via Homebrew?"; then
  brew install node@20 || true
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
  # shellcheck disable=SC1090
  source ~/.zprofile
fi

NODE_VERSION=$(node -v || true)
if [[ -z "$NODE_VERSION" ]]; then
  echo "ERROR: Node was not installed. Please install Node 20 manually."
  exit 1
fi

echo "Current Node: $NODE_VERSION"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "dev" ]]; then
  echo "Switching to dev branch..."
  git fetch origin dev
  git checkout dev
fi

git pull origin dev

if prompt_yes_no "Run npm install now?"; then
  npm install
fi

echo "✅ Setup complete. Run 'npm run dev' to start the app."
