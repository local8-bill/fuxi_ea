import { NextResponse } from "next/server";

// Placeholder: would pull from graph storage once populated.
export async function GET() {
  return NextResponse.json({ ok: true, degrees: [] });
}
