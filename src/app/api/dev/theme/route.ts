"use server";

import { NextResponse } from "next/server";
import { applyTheme, THEMES } from "@/lib/themeTest";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "Theme switcher disabled in production." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const theme = searchParams.get("theme");

  if (!theme) {
    return NextResponse.json({ ok: false, message: "Missing theme query parameter.", available: THEMES }, { status: 400 });
  }

  try {
    await applyTheme(theme);
    return NextResponse.json({ ok: true, theme });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message ?? "Theme apply failed." }, { status: 500 });
  }
}
