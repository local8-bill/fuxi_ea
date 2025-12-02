import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const stepOrder = ["intake", "tech-stack", "connection-confirmation", "digital-enterprise"] as const;

async function fetchIncompleteStep(req: NextRequest, projectId: string): Promise<string | null> {
  try {
    const url = new URL(`/api/projects/state?projectId=${encodeURIComponent(projectId)}`, req.url);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const steps = json?.state?.steps;
    if (!steps) return null;
    for (const step of stepOrder) {
      const stat = steps[step];
      if (!stat || stat.status !== "complete") return step;
    }
    return "digital-enterprise";
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const match = pathname.match(/^\/project\/([^/]+)\/(tech-stack|connection-confirmation|digital-enterprise)/);
  if (!match) return NextResponse.next();

  const projectId = match[1];
  const step = match[2];
  const incomplete = await fetchIncompleteStep(request, projectId);
  if (!incomplete) {
    const redirect = new URL(`/project/${projectId}/intake`, url);
    return NextResponse.redirect(redirect);
  }
  const stepIndex = stepOrder.indexOf(step as any);
  const requiredIndex = stepOrder.indexOf(incomplete as any);
  if (requiredIndex < stepIndex) {
    const redirect = new URL(`/project/${projectId}/${incomplete}`, url);
    return NextResponse.redirect(redirect);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/project/:path*/tech-stack", "/project/:path*/connection-confirmation", "/project/:path*/digital-enterprise"],
};
