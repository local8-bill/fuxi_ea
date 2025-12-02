import { NextResponse } from "next/server";
import { loadValidated } from "@/lib/schema/loaders";
import { System } from "@/lib/schema/entities";

export async function GET() {
  const { data, errors } = await loadValidated<System>("systems");
  const { data: integrations } = await loadValidated("integrations");
  return NextResponse.json({
    systems: data,
    integrations,
    errors,
  });
}
