#!/usr/bin/env bash
set -euo pipefail

REPO="local8-bill/fuxi_ea"

echo "Creating labels in $REPO..."
echo

gh label create ingestion             --repo "$REPO" --color "5319e7" --description "Ingestion & parsing work"
gh label create enhancement           --repo "$REPO" --color "1d76db" --description "Enhancement / new capability"
gh label create architecture          --repo "$REPO" --color "6f42c1" --description "Architecture & core design"
gh label create ui-ux                 --repo "$REPO" --color "c5def5" --description "UI and UX improvements"
gh label create feature               --repo "$REPO" --color "0e8a16" --description "Major product feature"
gh label create capabilities          --repo "$REPO" --color "bfe5bf" --description "Business capability work"
gh label create ai                    --repo "$REPO" --color "5319e7" --description "AI / reasoning / cognition"
gh label create dependencies          --repo "$REPO" --color "fbca04" --description "System and data dependencies"
gh label create roadmap               --repo "$REPO" --color "f9d0c4" --description "Roadmap & sequencing"
gh label create modernization-engine  --repo "$REPO" --color "d93f0b" --description "Modernization engine core"
gh label create risk                  --repo "$REPO" --color "b60205" --description "Risk & mitigation work"
gh label create normalization         --repo "$REPO" --color "0052cc" --description "Normalization & rollups"
gh label create documentation         --repo "$REPO" --color "c2e0c6" --description "Docs / internal writeups"
gh label create deep-model            --repo "$REPO" --color "5319e7" --description "Deeper system/capability modeling"
gh label create plugin                --repo "$REPO" --color "bfd4f2" --description "Pluggable extensions / templates"

echo
echo "Done! Run: gh label list -R \"$REPO\" to verify."