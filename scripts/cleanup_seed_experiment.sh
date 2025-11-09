#!/usr/bin/env bash
set -euo pipefail

# Ensure we’re at repo root
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "${ROOT}" ]; then
  echo "Run this inside the git repo."
  exit 1
fi
cd "${ROOT}"

echo "==> Removing experimental seed files/folders…"
rm -rf src/data/seed || true

echo "==> Verifying controller import now points to retail.json…"
if grep -RIl "@/data/seed/demo" src/controllers/useScoringPage.ts >/dev/null 2>&1; then
  echo "ERROR: useScoringPage.ts still imports @/data/seed/demo. Fix before committing."
  exit 1
fi

echo "==> (Optional) Remove PWA icon/manifest files if you added them and don't want them now"
# Uncomment if you want to remove them
# rm -f public/site.webmanifest public/icon-192.png public/icon-512.png public/apple-touch-icon.png || true

echo "==> Clearing build artifacts…"
rm -rf .next .turbo

echo "==> Formatting changed files…"
npx --yes prettier -w src/controllers/useScoringPage.ts

echo "==> Committing cleanup…"
git add -A
git commit -m "cleanup: drop ad-hoc demo seed; use retail.json for first-load seeding in demo only" || true

echo "==> Done."
echo "Next:"
echo "  npm run build"
echo "  vercel --prod --force   # (or push to your release branch)"