import fs from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const PROJECTS_ROOT = path.join(DATA_ROOT, "projects");

// Next 16: params is a Promise and must be awaited.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerificationPage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id;
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "";
  const state = await readState(projectId);

  if (!state) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Verification Dashboard</h1>
        <p className="mt-3 text-slate-600">No project state found for {projectId}. Initialize the project first.</p>
      </div>
    );
  }

  const steps = ["intake", "tech-stack", "connection-confirmation", "digital-enterprise"] as const;

  const directives = [
    { id: "D033", title: "Harmonization addendum & preview", status: "complete", note: "Domain fidelity + preview layer" },
    { id: "D034", title: "Transformation dialogue", status: "complete", note: "Dialogue UI + telemetry" },
    { id: "D035", title: "Connection confirmation", status: "complete", note: "Confirm/undo, rationale saved" },
    { id: "D036", title: "Unified project flow", status: "complete", note: "Middleware gating + flow bar" },
    { id: "D037", title: "Graph visuals", status: "complete", note: "Edge palette, legend, focus, keep-in-future" },
    { id: "D038", title: "Ship pack prep", status: "complete", note: "Refactor/build fixes, harmonization UX" },
    { id: "D039", title: "Pre-D040 cleanup", status: "complete", note: "Merged to main, tag v0.6.5-pre-d040" },
    { id: "D040", title: "Transformation sequencer", status: "pending", note: "Next: mock data pilot" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Verification Dashboard</h1>
      <p className="mt-2 text-slate-600">Step completion and timestamps for project {projectId}.</p>
      <div className="mt-6 overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {steps.map((s) => {
              const st = (state as any)?.steps?.[s];
              return (
                <tr key={s} className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">{s}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2 py-1 text-xs font-semibold " +
                        (st?.status === "complete" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700")
                      }
                    >
                      {st?.status ?? "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{st?.updatedAt ? new Date(st.updatedAt).toLocaleString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Directive Status</h2>
        <p className="text-sm text-slate-600">Summary through D039; D040 planned.</p>
        <div className="mt-3 overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Directive</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {directives.map((d) => (
                <tr key={d.id} className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">{d.id}</td>
                  <td className="px-4 py-3 text-slate-800">{d.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2 py-1 text-xs font-semibold " +
                        (d.status === "complete"
                          ? "bg-emerald-100 text-emerald-800"
                          : d.status === "pending"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-800")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

async function readState(projectId: string): Promise<any | null> {
  try {
    const raw = await fs.readFile(path.join(PROJECTS_ROOT, projectId, "project.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
