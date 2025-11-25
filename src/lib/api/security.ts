import { NextRequest, NextResponse } from "next/server";

const AUTH_TOKEN =
  process.env.FUXI_API_TOKEN ??
  process.env.MESH_AUTH_TOKEN ??
  process.env.API_TOKEN;

const AUTH_DISABLED = (() => {
  const raw = process.env.FUXI_AUTH_DISABLED ?? process.env.FUXI_AUTH_OPTIONAL;
  if (raw == null) return true; // default: no auth required in dev
  const val = raw.toLowerCase();
  return val === "1" || val === "true";
})();

export function requireAuth(req: NextRequest): NextResponse | null {
  // Auth disabled by default (can be re-enabled by setting FUXI_AUTH_DISABLED=false)
  if (AUTH_DISABLED) return null;

  if (!AUTH_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Server auth token is not configured" },
      { status: 500 },
    );
  }

  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const token = header.replace("Bearer ", "").trim();
  if (token !== AUTH_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}

type RateLimiterOptions = {
  windowMs: number;
  max: number;
  name?: string;
};

type RateEntry = {
  count: number;
  resetTime: number;
};

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const token = req.headers.get("authorization")?.slice(0, 32) || "";
  return `${ip}|${token}`;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max } = options;
  const store = new Map<string, RateEntry>();

  return (req: NextRequest): NextResponse | null => {
    const key = clientKey(req);
    const now = Date.now();

    const existing = store.get(key);
    if (existing && now < existing.resetTime) {
      if (existing.count >= max) {
        return NextResponse.json(
          {
            ok: false,
            error: "Rate limit exceeded",
            retryAfterMs: existing.resetTime - now,
          },
          { status: 429, headers: { "Retry-After": `${Math.ceil((existing.resetTime - now) / 1000)}` } },
        );
      }
      existing.count += 1;
      store.set(key, existing);
      return null;
    }

    store.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  };
}

export function jsonError(
  status: number,
  error: string,
  detail?: string,
): NextResponse {
  return NextResponse.json(
    { ok: false, error, detail },
    { status },
  );
}
