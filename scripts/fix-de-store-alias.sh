#!/usr/bin/env bash
set -euo pipefail

FILE="src/domain/services/digitalEnterpriseStore.ts"

echo "=== Fuxi DE Store Alias Fix ==="
echo "Project root: $(pwd)"
echo "Target file:  $FILE"
echo

# 1) Ensure file exists
if [ ! -f "$FILE" ]; then
  echo "ERROR: File not found: $FILE" >&2
  echo "Aborting. Check your path or move this script to project root." >&2
  exit 1
fi

# 2) Ensure the underlying function exists
if ! grep -q 'saveLucidItemsForProject' "$FILE"; then
  echo "ERROR: 'saveLucidItemsForProject' not found in $FILE" >&2
  echo "Aborting to avoid guessing the wrong symbol." >&2
  exit 1
fi

# 3) If the alias already exists, do nothing
if grep -q 'saveDigitalEnterpriseView' "$FILE"; then
  echo "Alias 'saveDigitalEnterpriseView' already present in $FILE."
  echo "No changes made."
  exit 0
fi

# 4) Append the alias export
echo "Appending alias export to $FILE ..."
cat <<'TS_APPEND' >> "$FILE"

//
// Alias added by scripts/fix-de-store-alias.sh to satisfy API import:
//   import { saveDigitalEnterpriseView } from "@/domain/services/digitalEnterpriseStore";
//
export { saveLucidItemsForProject as saveDigitalEnterpriseView };
TS_APPEND

echo "Alias added successfully."
echo

# 5) Show git diff for safety (non-fatal if git not present)
if command -v git >/dev/null 2>&1; then
  echo "=== git diff for $FILE ==="
  git diff -- "$FILE" || true
else
  echo "git not found; skipping diff."
fi

echo
echo "Done. Re-run your build (e.g. 'pnpm dev' or 'pnpm build')."
