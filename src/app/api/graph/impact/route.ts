"use server";

import { NextResponse } from "next/server";

// Placeholder: will calculate impact scores once graph data is available.
export async function GET() {
  return NextResponse.json({ ok: true, impact: [] });
}
