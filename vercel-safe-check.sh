#!/usr/bin/env bash
# ----------------------------------------------
# fuxi_ea deployment safety check for Vercel CLI
# ----------------------------------------------

EXPECTED_USER="local8-bill"  # 👈 replace this!
EXPECTED_TEAM=""                          # 👈 optional: set if deploying under a team/org

set -e

# Who is logged in?
CURRENT_USER=$(vercel whoami 2>/dev/null || echo "none")

if [ "$CURRENT_USER" = "none" ]; then
  echo "❌ You are not logged into Vercel CLI. Run: vercel login"
  exit 1
fi

if [ "$CURRENT_USER" != "$EXPECTED_USER" ]; then
  echo "⚠️  Wrong Vercel account detected!"
  echo "   Logged in as: $CURRENT_USER"
  echo "   Expected:     $EXPECTED_USER"
  echo
  echo "👉 Run: vercel logout && vercel login"
  exit 1
fi

echo "✅ Vercel user check passed: $CURRENT_USER"
exit 0