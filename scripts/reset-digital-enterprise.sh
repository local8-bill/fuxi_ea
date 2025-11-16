#!/usr/bin/env bash
set -euo pipefail

echo "=== Fuxi: resetting Digital Enterprise backend ==="

# 1) Clean up old routes (safe: rm -rf ignores if they don't exist)
echo "[1/3] Removing old digital-enterprise API routes (if any)..."
rm -rf src/app/api/digital-enterprise

# If we ever accidentally put them under app/ without src/, clean that too:
rm -rf app/api/digital-enterprise || true

# 2) Recreate clean directory structure
echo "[2/3] Creating directory structure..."
mkdir -p src/domain/services
mkdir -p src/app/api/digital-enterprise/lucid
mkdir -p src/app/api/digital-enterprise/stats

# 3) Create stub files
echo "[3/3] Creating stub files..."

# Store stub
cat <<'STORE' > src/domain/services/digitalEnterpriseStore.ts
// TODO: Paste the full implementation from Fuxi here.
//
// This module should export at least:
//
//   export type DigitalEnterpriseItem = { ... };
//   export type DigitalEnterpriseStats = { ... };
//   export function saveLucidItemsForProject(projectId: string, items: DigitalEnterpriseItem[]): void;
//   export function getStatsForProject(projectId: string): DigitalEnterpriseStats;
//
// For now we export an empty placeholder so TypeScript compiles.

export {};
STORE

# Lucid upload route stub
cat <<'LUCID' > src/app/api/digital-enterprise/lucid/route.ts
// TODO: Paste the full /api/digital-enterprise/lucid POST handler from Fuxi.
//
// Expected shape:
//
//   import { NextRequest, NextResponse } from "next/server";
//   import { saveLucidItemsForProject, getStatsForProject } from "@/domain/services/digitalEnterpriseStore";
//
//   export const runtime = "nodejs";
//
//   export async function POST(req: NextRequest) { ... }
//
// For now, a minimal stub so the route exists but always 501s.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Not implemented. Paste Digital Enterprise Lucid handler here." },
    { status: 501 },
  );
}
LUCID

# Stats route stub
cat <<'STATS' > src/app/api/digital-enterprise/stats/route.ts
// TODO: Paste the full /api/digital-enterprise/stats GET handler from Fuxi.
//
// Expected shape:
//
//   import { NextRequest, NextResponse } from "next/server";
//   import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";
//
//   export const runtime = "nodejs";
//
//   export async function GET(req: NextRequest) { ... }
//
// For now, a minimal stub so the route exists but always returns zeros.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project") || "demo";

  return NextResponse.json({
    projectId,
    stats: {
      systemsFuture: 0,
      integrationsFuture: 0,
      domainsDetected: 0,
    },
    note: "Stub implementation. Paste real Digital Enterprise stats handler here.",
  });
}
STATS

echo "=== Done. Now paste real implementations into:"
echo "  - src/domain/services/digitalEnterpriseStore.ts"
echo "  - src/app/api/digital-enterprise/lucid/route.ts"
echo "  - src/app/api/digital-enterprise/stats/route.ts"
