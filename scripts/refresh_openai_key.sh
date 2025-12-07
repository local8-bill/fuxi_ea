#!/bin/zsh
# refresh_openai_key.sh
# Helper script to update your OpenAI API key for both CLI and VS Code Codex environments

# Usage: bash refresh_openai_key.sh sk-your-new-key [--vscode]

NEW_KEY=$1
UPDATE_VSCODE=$2

if [ -z "$NEW_KEY" ]; then
  echo "❌ No API key provided."
  echo "Usage: bash refresh_openai_key.sh sk-your-new-key [--vscode]"
  exit 1
fi

# Export new key for current session
export OPENAI_API_KEY="$NEW_KEY"
echo "✅ Updated OPENAI_API_KEY for current session."

# Detect shell profile
if [ -n "$ZSH_VERSION" ]; then
  PROFILE_FILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
  PROFILE_FILE="$HOME/.bash_profile"
else
  PROFILE_FILE="$HOME/.profile"
fi

# Update or append key in shell profile
if grep -q 'OPENAI_API_KEY' "$PROFILE_FILE"; then
  sed -i.bak "/OPENAI_API_KEY/d" "$PROFILE_FILE"
fi
echo "export OPENAI_API_KEY=\"$NEW_KEY\"" >> "$PROFILE_FILE"

echo "✅ Added OPENAI_API_KEY to $PROFILE_FILE (persistent)."

# Clear any old cached CLI config
rm -f ~/.openai/api_key 2>/dev/null

echo "🧹 Cleared cached CLI key file (if present)."

# Optional VS Code key update
if [ "$UPDATE_VSCODE" = "--vscode" ]; then
  SETTINGS_FILE="$HOME/Library/Application Support/Code/User/settings.json"
  if [ -f "$SETTINGS_FILE" ]; then
    echo "⚙️  Updating VS Code OpenAI key in $SETTINGS_FILE..."
    if grep -q 'openai.apiKey' "$SETTINGS_FILE"; then
      # Replace existing key entry
      sed -i.bak "s/\"openai.apiKey\": \".*\"/\"openai.apiKey\": \"$NEW_KEY\"/" "$SETTINGS_FILE"
    else
      # Insert new key entry
      TMPFILE=$(mktemp)
      jq ". + {\"openai.apiKey\": \"$NEW_KEY\"}" "$SETTINGS_FILE" > "$TMPFILE" && mv "$TMPFILE" "$SETTINGS_FILE"
    fi
    echo "✅ VS Code OpenAI key updated."
  else
    echo "⚠️  VS Code settings.json not found. Skipping VS Code update."
  fi
fi

# Verify CLI connection
echo "⚙️  Verifying OpenAI CLI connection..."
openai api models.list | grep '"id"' | head -10

echo "🚀 Key refresh complete. CLI and VS Code (if selected) are now authenticated with the new OpenAI API key."
