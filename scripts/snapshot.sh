#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/snapshot.sh "reason message (optional)"
# Creates a timestamped stable branch and a good-build tag, pushes both.

STAMP=$(date -u +"%Y-%m-%dT%H%MZ")
TAG="good-build-${STAMP}"
BRANCH="stable/prod-${STAMP}"
MSG=${1:-"Good build snapshot ${STAMP}"}

# Ensure clean and on main
git rev-parse --abbrev-ref HEAD | grep -qx "main" || { echo "✖ Be on 'main'"; exit 1; }
git diff --quiet || { echo "✖ Working tree not clean"; exit 1; }

SHA=$(git rev-parse --short HEAD)
echo "🔖 Tag: $TAG  |  🌿 Branch: $BRANCH  |  @ $SHA"

git tag -a "$TAG" -m "$MSG"
git checkout -b "$BRANCH"
git push -u origin "$BRANCH"
git push origin "$TAG"
git switch main

echo "✅ Snapshot done:"
echo "   - Tag: $TAG"
echo "   - Branch: $BRANCH"