#!/usr/bin/env bash
set -euo pipefail

# --- Config (via env) ---
: "${VERCEL_TOKEN:?Set VERCEL_TOKEN (Vercel personal token)}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID (e.g., prj_xxx)}"
VERCEL_TEAM_ID="${VERCEL_TEAM_ID:-}"   # optional (e.g., team_xxx)
KEEP="${KEEP:-3}"                      # how many to keep
DRY_RUN="${DRY_RUN:-1}"                # 1 = don't delete, just show; 0 = actually delete

API="https://api.vercel.com"

qs_project="projectId=${VERCEL_PROJECT_ID}&target=production&limit=200"
qs_team=""; [[ -n "$VERCEL_TEAM_ID" ]] && qs_team="&teamId=${VERCEL_TEAM_ID}"

auth=(-H "Authorization: Bearer ${VERCEL_TOKEN}")

echo "🔎 Listing deployments for project=${VERCEL_PROJECT_ID} (team=${VERCEL_TEAM_ID:-none}), keeping latest ${KEEP} …"

# Fetch latest (up to 200) production deployments
resp="$(curl -fsSL "${API}/v6/deployments?${qs_project}${qs_team}" "${auth[@]}")"

# Sort by creation time desc, keep first KEEP, mark rest for deletion
mapfile -t TO_DELETE < <(jq -r --argjson keep "$KEEP" '
  [.deployments[]]
  | sort_by(.created) | reverse
  | .[$keep:]         # everything after the first N
  | .[].uid           # deployment IDs
' <<< "$resp")

# Show what we’re doing
total=$(jq -r '.deployments | length' <<< "$resp")
echo "📦 Total prod deployments found: ${total}"
echo "✅ Will keep: ${KEEP}"
echo "🗑️  Will delete: ${#TO_DELETE[@]}"

if [[ ${#TO_DELETE[@]} -eq 0 ]]; then
  echo "Nothing to prune. Done."
  exit 0
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "💡 DRY RUN (set DRY_RUN=0 to actually delete). Candidates:"
  printf ' - %s\n' "${TO_DELETE[@]}"
  exit 0
fi

# Delete loop
fail=0
for id in "${TO_DELETE[@]}"; do
  url="${API}/v13/deployments/${id}"
  [[ -n "$VERCEL_TEAM_ID" ]] && url="${url}?teamId=${VERCEL_TEAM_ID}"
  echo "❌ Deleting ${id} …"
  if ! curl -fsS -X DELETE "$url" "${auth[@]}" >/dev/null; then
    echo "   ↳ ⚠️  Failed to delete ${id}"
    ((fail++))
  else
    echo "   ↳ ✅ Deleted"
  fi
done

[[ $fail -gt 0 ]] && { echo "Done with ${fail} failures."; exit 1; } || echo "✨ Prune complete."
