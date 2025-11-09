#!/usr/bin/env bash
# Cleanup and retarget fuxi_ea to a new GitHub repo / Vercel setup
# Usage:
#   ./cleanup-and-retarget.sh retarget   # keep history, just point to new remote
#   ./cleanup-and-retarget.sh fresh      # nuke .git and start fresh history

set -euo pipefail

### >>> EDIT THESE TWO <<< ###
NEW_GIT_URL="git@github.com:local8-bill/fuxi_ea.git"   # or https://github.com/local8-bill/fuxi_ea.git
NEW_GH_SLUG="local8-bill/fuxi_ea"                      # owner/repo (for README badge swap; optional)
### >>> END EDITS <<< ###

MODE="${1:-retarget}"  # retarget | fresh

# Sanity: must be repo root
if [[ ! -f "package.json" ]]; then
  echo "❌ Run from the project root (where package.json lives)."; exit 1
fi

echo "🔧 Housekeeping…"

# 0) kill dev, clear caches
pkill -f "next dev" 2>/dev/null || true
rm -rf .next node_modules/.cache public/test.css

# 1) ensure .gitignore is sane
if ! grep -q ".next/" .gitignore 2>/dev/null; then
  cat >> .gitignore <<'EOF'

# node / next
node_modules/
.next/
*.log
npm-debug.log*

# os/editor
.DS_Store
.vscode/
*.sublime-workspace
*.sublime-project

# env/build artifacts
.env*
public/test.css
.next/tw-test.css

# local archives
_archive/
src_backup_*/
src_broken_*/
src_clean*/
EOF
  echo "🧹 Updated .gitignore"
fi

# 2) remove Vercel local link (we’ll relink under new account)
if [[ -d ".vercel" ]]; then
  rm -rf .vercel
  echo "🗑️  Removed .vercel (project will relink on first deploy)"
fi

# 3) Optional: scrub old README badges/links (best-effort)
if [[ -n "$NEW_GH_SLUG" && -f README.md ]]; then
  # Replace any old GitHub slug patterns with the new one (heuristic)
  # Edit OLD_GH_SLUG below if you know it; otherwise this does a generic swap of owner/repo patterns
  OLD_OWNER_PATTERN='[A-Za-z0-9._-]+'
  OLD_REPO_PATTERN='[A-Za-z0-9._-]+'
  sed -E -i'' "s#github\.com/${OLD_OWNER_PATTERN}/${OLD_REPO_PATTERN}#github.com/${NEW_GH_SLUG}#g" README.md || true
  echo "📝 Normalized README GitHub links → ${NEW_GH_SLUG}"
fi

# 4) Git wiring
if [[ "$MODE" == "fresh" ]]; then
  echo "🧨 Fresh mode: removing .git and starting new history…"
  rm -rf .git
  git init
  git add -A
  git commit -m "chore: initial import (clean reset for local8-bill)"
  git branch -M main
  git remote add origin "$NEW_GIT_URL"
  git push -u origin main
  echo "✅ Fresh repo pushed to $NEW_GIT_URL"
elif [[ "$MODE" == "retarget" ]]; then
  echo "🔁 Retarget mode: keeping history, updating origin…"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git remote get-url origin >/dev/null 2>&1; then
      git remote set-url origin "$NEW_GIT_URL"
    else
      git remote add origin "$NEW_GIT_URL"
    fi
    git add -A
    if ! git diff --cached --quiet; then
      git commit -m "chore: repo housekeeping and remote retarget"
    fi
    git branch -M main
    git push -u origin main
    echo "✅ Remote retargeted and pushed to $NEW_GIT_URL"
  else
    echo "❌ Not a git repo. Use: ./cleanup-and-retarget.sh fresh"; exit 1
  fi
else
  echo "❌ Unknown mode: $MODE (use 'retarget' or 'fresh')"; exit 1
fi

echo "✨ Done. Next steps:
  1) Open in VS Code
  2) vercel login   # with your NEW account
  3) vercel link    # point to the new project under local8-bill
  4) vercel --prod
"