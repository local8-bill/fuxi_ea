"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";

interface IntakePageProps {
  params: { id: string };
}

interface IntakeFormState {
  industry: string;
  businessGoals: string;
  hasCapabilityMap: "yes" | "no" | "unsure" | "";
  capabilityNotes: string;
  untouchableSystems: string;
  bigBetAreas: string;
  constraints: string;
}

const initialState: IntakeFormState = {
  industry: "",
  businessGoals: "",
  hasCapabilityMap: "",
  capabilityNotes: "",
  untouchableSystems: "",
  bigBetAreas: "",
  constraints: "",
};

export default function ProjectIntakePage({ params }: IntakePageProps) {
  const router = useRouter();
  const projectId = params.id;
  const [form, setForm] = useState<IntakeFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  function handleChange<K extends keyof IntakeFormState>(
    field: K,
    value: IntakeFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);

      // TODO: POST to /api/projects/{projectId}/intake
      console.log("[INTAKE] Submitted for project", projectId, form);

      router.push(`/project/${encodeURIComponent(projectId)}/tech-stack`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <WorkspaceHeader
        statusLabel="INTAKE"
        title="Project Intake"
        description="Tell Fuxi about your environment so we can generate a transformation roadmap that actually matches your strategy, constraints, and risk appetite."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <div className="space-y-6">
            {/* Industry & goals */}
            <section className="space-y-4">
              <div>
                <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
                  Context
                </p>
                <p className="text-xs text-gray-500">
                  Start with where you play and what you&apos;re trying to do.
                  Fuxi will use this to tune recommendations and trade-offs.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Industry
                  </label>
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Retail, manufacturing, CPG, etc."
                    value={form.industry}
                    onChange={(e) => handleChange("industry", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Business goals (top 3)
                  </label>
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Growth, modernization, simplification, cost reduction, etc."
                    value={form.businessGoals}
                    onChange={(e) =>
                      handleChange("businessGoals", e.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            {/* Capability map */}
            <section className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Do you have an existing capability map?
                  </label>
                  <p className="text-[0.7rem] text-slate-500">
                    We&apos;ll wire this into Fuxi&apos;s capability engine later.
                    For now, we just need to know what we&apos;re working with.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[0.75rem]">
                {([
                  ["yes", "Yes – we actively use one"],
                  ["no", "No – not yet"],
                  ["unsure", "Not sure / it&apos;s dusty"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      handleChange("hasCapabilityMap", value as any)
                    }
                    className={`rounded-full border px-3 py-1.5 font-medium transition ${
                      form.hasCapabilityMap === value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: label,
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Notes about capability map (optional)
                </label>
                <textarea
                  className="min-h-[60px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="Where it lives, who owns it, how trusted it is, etc."
                  value={form.capabilityNotes}
                  onChange={(e) =>
                    handleChange("capabilityNotes", e.target.value)
                  }
                />
              </div>
            </section>

            {/* Systems + bets */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Untouchable systems / platforms
                </label>
                <textarea
                  className="min-h-[70px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="SAP, Oracle EBS, mainframe, anything that is off-limits or extremely hard to move."
                  value={form.untouchableSystems}
                  onChange={(e) =>
                    handleChange("untouchableSystems", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Where are you willing to take big bets?
                </label>
                <textarea
                  className="min-h-[70px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="E‑commerce, supply chain, data platform, customer experience, etc."
                  value={form.bigBetAreas}
                  onChange={(e) =>
                    handleChange("bigBetAreas", e.target.value)
                  }
                />
              </div>
            </section>

            {/* Constraints */}
            <section className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Constraints (financial, people, change tolerance)
                </label>
                <textarea
                  className="min-h-[70px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="Budget bands, staffing limits, change windows, markets that can’t be disrupted, etc."
                  value={form.constraints}
                  onChange={(e) =>
                    handleChange("constraints", e.target.value)
                  }
                />
              </div>

              <p className="text-[0.7rem] text-slate-500">
                Fuxi will use this to pace your roadmap — where to go hard,
                where to phase, and where to leave things alone (for now).
              </p>
            </section>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] text-slate-500">
            You can always come back and refine this. Think of it as your
            strategy fingerprint for project{" "}
            <span className="font-medium">{projectId}</span>.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Locking it in…" : "Continue → Generate Strategy"}
          </button>
        </div>
      </form>
    </div>
  );
}
