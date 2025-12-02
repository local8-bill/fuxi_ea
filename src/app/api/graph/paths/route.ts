import { NextResponse } from "next/server";

// Placeholder: returns empty path set until graph store is populated.
export async function GET() {
  return NextResponse.json({ ok: true, paths: [] });
}
