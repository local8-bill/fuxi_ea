#!/bin/zsh
set -e

GLOBAL_CSS="src/app/globals.css"
BACKUP="src/app/globals.css.bak_$(date +%Y%m%d%H%M%S)"

echo "📦 Backing up $GLOBAL_CSS → $BACKUP"
cp "$GLOBAL_CSS" "$BACKUP"

# Only append the rule if it's not already present
if ! grep -q "input\[type=\"file\"\]" "$GLOBAL_CSS"; then
  echo "✍️  Appending global rule to hide native file inputs…"

  cat << 'EOF' >> "$GLOBAL_CSS"

/* Fuxi: hide all native file inputs; we use custom pill uploaders instead */
input[type="file"] {
  display: none;
}
EOF
else
  echo "ℹ️  input[type=\"file\"] rule already present in $GLOBAL_CSS, skipping append."
fi

echo "✅ Done."
echo "🔄 Now: restart your dev server (npm run dev) and hard-refresh the page."
echo "👀 You should see ONLY the green 'Upload … CSV' pill + filename — no grey 'Choose File' button."
