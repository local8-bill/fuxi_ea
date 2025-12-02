#!/usr/bin/env bash
set -euo pipefail

REPO="local8-bill/fuxi_ea"

tag_issue() {
  local search="$1"
  local label="$2"

  num=$(gh issue list -R "$REPO" --search "$search" --json number -q '.[0].number' || true)

  if [ -z "$num" ]; then
    echo "⚠️  No issue found for search: $search"
    return
  fi

  echo "Tagging #$num with '$label' ($search)"
  gh issue edit "$num" -R "$REPO" --add-label "$label"
}

echo "Tagging NOW issues..."
tag_issue "Unified ingestion pipeline" now
tag_issue "Column mapping wizard" now
tag_issue "Advanced artifact intelligence" now
tag_issue "App ↔ capability mapping" now
tag_issue "Modernization workspace UX" now

echo
echo "Tagging NEXT issues..."
tag_issue "Dependency inference v2" next
tag_issue "Roadmap Engine v2" next
tag_issue "High-risk systems view" next
tag_issue "Consultant guidance layer" next
tag_issue "Business ↔ technology fusion engine" next

echo
echo "Tagging N3 issues..."
tag_issue "Engagement persistence layer" n3
tag_issue "Visualization layer" n3
tag_issue "Industry templates" n3
tag_issue "Joshua ↔ Fuxi integration" n3

echo
echo "Done. Project workflows will move cards to the right columns automatically (once you set them up)."