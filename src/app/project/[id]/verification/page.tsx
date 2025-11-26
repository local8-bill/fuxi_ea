"use server";

import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";
import { DirectiveTable } from "@/components/verification/DirectiveTable";
import { TestResults } from "@/components/verification/TestResults";
import { HealthMeter } from "@/components/verification/HealthMeter";
import { loadVerificationData } from "@/lib/verification/data";
import { notFound } from "next/navigation";

type Params = { id: string };

export default async function VerificationPage({ params }: { params: Params }) {
  const projectId = params?.id;
  if (!projectId) return notFound();

  const { directives, tests, summary } = await loadVerificationData();

  return (
    <div className="px-6 py-8 md:px-8 lg:px-10 max-w-6xl mx-auto space-y-6">
      <WorkspaceHeader
        statusLabel="D014 · Verification"
        title="Testing & Verification Dashboard"
        description="Central view of directive status, test outcomes, and component health signals."
      >
        <p className="text-xs text-gray-500 mt-1">
          Project: {projectId} · Pulls directive metadata from docs/features and test stubs from /tests/results (D017 hookup pending).
        </p>
      </WorkspaceHeader>

      <Card className="space-y-3">
        <HealthMeter summary={summary} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">Directives</p>
              <p className="text-xs text-slate-500">Parsed from docs/features/*.md · Status inferred from content.</p>
            </div>
          </div>
          <DirectiveTable items={directives} />
        </Card>

        <Card className="space-y-3">
          <div>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">Tests</p>
            <p className="text-xs text-slate-500">Waiting on D017 feed in /tests/results/*.json.</p>
          </div>
          <TestResults results={tests} />
        </Card>
      </div>

      <Card className="space-y-2">
        <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase mb-1">Summary</p>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>Directive registry auto-parsed; statuses are best-effort from file content.</li>
          <li>Tests integrate with future D017 runner; currently shows any JSON in /tests/results.</li>
          <li>Build status placeholder; wire to CI feed when available.</li>
        </ul>
      </Card>
    </div>
  );
}
