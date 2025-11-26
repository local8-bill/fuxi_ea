import { validateAll } from "@/lib/schema/validate";

export const dynamic = "force-dynamic";

export default async function SchemaValidatePage() {
  const summaries = await validateAll();
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">Schema Validation</h1>
      <p className="mt-1 text-sm text-slate-600">
        Snapshot of validated datasets from .fuxi/data (systems, integrations, domains, capabilities, ROI, AI, events, KPIs, risk, data sources).
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Dataset</th>
              <th className="px-3 py-2 text-left">Count</th>
              <th className="px-3 py-2 text-left">Latest Updated</th>
              <th className="px-3 py-2 text-left">Errors</th>
              <th className="px-3 py-2 text-left">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.name} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-900">{s.name}</td>
                <td className="px-3 py-2 text-slate-700">{s.count}</td>
                <td className="px-3 py-2 text-slate-700 text-xs">{s.latestUpdated || "n/a"}</td>
                <td className="px-3 py-2 text-xs text-red-600">
                  {s.errors.length ? s.errors.join("; ") : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-amber-700">
                  {s.warnings.length ? s.warnings.join("; ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
