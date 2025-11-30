import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const PROJECTS_ROOT = path.join(DATA_ROOT, "projects");

const stepOrder = ["intake", "tech-stack", "connection-confirmation", "digital-enterprise"] as const;

function projectFile(projectId: string) {
  return path.join(PROJECTS_ROOT, projectId, "project.json");
}

async function readStep(projectId: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(projectFile(projectId), "utf8");
    const json = JSON.parse(raw);
    if (json?.steps) {
      for (const step of stepOrder) {
        const stat = json.steps[step];
        if (!stat || stat.status !== "complete") return step;
      }
      return "digital-enterprise";
    }
  } catch {
    return null;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const match = pathname.match(/^\/project\/([^/]+)\/(tech-stack|connection-confirmation|digital-enterprise)/);
  if (!match) return NextResponse.next();
  const projectId = match[1];
  const step = match[2];
  const incomplete = await readStep(projectId);
  if (!incomplete) {
    // No state; send to intake
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
