#!/usr/bin/env bash
# Quick helper to print common app routes (run from repo root)
set -e

echo "Common app routes:"
cat <<'ROUTES'
- Intake (new):           /project/new/intake
- Intake (existing):      /project/<id>/intake
- Onboarding:             /project/<id>/onboarding
- UX Shell:               /project/<id>/uxshell
- Digital Enterprise:     /project/<id>/digital-enterprise
- ROI Dashboard:          /project/<id>/roi-dashboard
- Transformation Dialogue:/project/<id>/transformation-dialogue
ROUTES
