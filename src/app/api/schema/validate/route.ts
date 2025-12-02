import { NextResponse } from "next/server";
import { validateAll } from "@/lib/schema/validate";

export async function GET() {
  const summaries = await validateAll();
  const errors = summaries.flatMap((s) => s.errors);
  return NextResponse.json({
    ok: errors.length === 0,
    summaries,
  });
}
