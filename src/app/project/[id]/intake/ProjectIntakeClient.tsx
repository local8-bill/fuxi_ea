"use client";

import { useState } from "react";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Card } from "@/components/ui/Card";

interface Props {
  projectId: string;
}

type StrategyDriverId =
  | "grow-revenue"
  | "reduce-cost"
  | "modernize-tech"
  | "improve-cx"
  | "increase-speed"
  | "harmonize-data"
  | "expand-globally"
  | "reduce-risk"
  | "ma-readiness";

type OpportunityZoneId =
  | "ecommerce"
  | "supply-chain"
  | "data"
  | "integration"
  | "martech"
  | "erp-adjacent"
  | "customer-service"
  | "analytics";

type TransformationAttitude = "steady" | "balanced" | "aggressive";
type ChangeCapacity = "low" | "normal" | "high";

const INDUSTRY_OPTIONS = [
  { id: "retail", label: "Retail / DTC" },
  { id: "consumer", label: "Consumer / CPG" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "financial-services", label: "Financial services" },
  { id: "healthcare", label: "Healthcare / Life sciences" },
  { id: "technology", label: "Technology / SaaS" },
  { id: "public-sector", label: "Public sector" },
  { id: "other", label: "Other" },
];

const STRATEGY_DRIVERS: { id: StrategyDriverId; label: string }[] = [
  { id: "grow-revenue", label: "Grow revenue" },
  { id: "reduce-cost", label: "Reduce operating cost" },
  { id: "modernize-tech", label: "Modernize tech" },
  { id: "improve-cx", label: "Improve customer experience" },
  { id: "increase-speed", label: "Increase speed / agility" },
  { id: "harmonize-data", label: "Harmonize data" },
  { id: "expand-globally", label: "Expand globally" },
  { id: "reduce-risk", label: "Reduce risk / compliance exposure" },
  { id: "ma-readiness", label: "M&A integration readiness" },
];

const OPPORTUNITY_ZONES: { id: OpportunityZoneId; label: string }[] = [
  { id: "ecommerce", label: "E-commerce" },
  { id: "supply-chain", label: "Supply chain" },
  { id: "data", label: "Data / platform" },
  { id: "integration", label: "Integration layer" },
  { id: "martech", label: "Martech stack" },
  { id: "erp-adjacent", label: "ERP-adjacent (WMS / OMS / PLM)" },
  { id: "customer-service", label: "Customer service tech" },
  { id: "analytics", label: "Analytics / insights" },
];

export default function ProjectIntakeClient({ projectId }: Props) {
  const [industry, setIndustry] = useState<string>("");
  const [customIndustry, setCustomIndustry] = useState<string>("");
  const [drivers, setDrivers] = useState<StrategyDriverId[]>([]);
  const [attitude, setAttitude] = useState<TransformationAttitude | "">("");
  const [sacredSystemsText, setSacredSystemsText] = useState<string>("");
  const [zones, setZones] = useState<OpportunityZoneId[]>([]);
  const [capacity, setCapacity] = useState<ChangeCapacity | "">("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  function toggleDriver(id: StrategyDriverId) {
    setDrivers((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  function toggleZone(id: OpportunityZoneId) {
    setZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id],
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        projectId,
        industry: industry || null,
        customIndustry: customIndustry || null,
        strategyDrivers: drivers,
        transformationAttitude: attitude || null,
        sacredSystemsRaw: sacredSystemsText,
        opportunityZones: zones,
        changeCapacity: capacity || null,
        notes: notes || null,
      };

      // For now we just log; wiring to an API can come next.
      console.log("[INTAKE] Save draft", payload);
      setSavedOnce(true);
    } finally {
      setSaving(false);
    }
  }

  function canContinue() {
    return (
      !!industry &&
      drivers.length > 0 &&
      !!attitude &&
      zones.length > 0 &&
      !!capacity
    );
  }

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <WorkspaceHeader
        statusLabel="INTAKE"
        title="Project Intake"
        description="Tell Fuxi how your world works so we can design a roadmap that actually matches your business."
      />

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase">
            PROJECT CONTEXT
          </p>
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold text-slate-50">
            STEP 0 · SET THE TABLE
          </span>
        </div>
        <p className="text-xs text-gray-500">
          This is the lens Fuxi will use when it scores your portfolio, suggests
          simplification moves, and builds a roadmap for project{" "}
          <span className="font-medium">{projectId}</span>.
        </p>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Industry */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-800 mb-2">
            1. What industry are you in?
          </h2>
          <p className="text-[0.75rem] text-slate-500 mb-3">
            This lets Fuxi preload common patterns, systems, and modernization
            paths for your world.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INDUSTRY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setIndustry(opt.id)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                  industry === opt.id
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>{opt.label}</span>
                {industry === opt.id && (
                  <span className="text-[0.65rem] font-semibold">
                    Selected
                  </span>
                )}
              </button>
            ))}
          </div>
          {industry === "other" && (
            <div className="mt-3">
              <label className="block text-[0.7rem] text-slate-500 mb-1">
                Describe your industry
              </label>
              <input
                type="text"
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Outdoor apparel, logistics, media…"
              />
            </div>
          )}
        </Card>

        {/* Strategy drivers */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-800 mb-2">
            2. What are the top 3 drivers for this transformation?
          </h2>
          <p className="text-[0.75rem] text-slate-500 mb-3">
            Fuxi will prioritize moves that align with these. Pick up to three.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STRATEGY_DRIVERS.map((d) => {
              const active = drivers.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDriver(d.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span>{d.label}</span>
                  {active && (
                    <span className="text-[0.65rem] font-semibold">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Transformation attitude + change capacity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h2 className="text-xs font-semibold text-slate-800 mb-2">
              3. How aggressive can we be?
            </h2>
            <p className="text-[0.75rem] text-slate-500 mb-3">
              This shapes how bold Fuxi will be with recommendations.
            </p>
            <div className="space-y-2">
              {[
                {
                  id: "steady",
                  label: "Steady",
                  desc: "Low risk, fewer moving parts at once.",
                },
                {
                  id: "balanced",
                  label: "Balanced",
                  desc: "Some bold moves, some safer bets.",
                },
                {
                  id: "aggressive",
                  label: "Aggressive",
                  desc: "Comfortable with larger step-changes.",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setAttitude(opt.id as TransformationAttitude)
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    attitude === opt.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[0.7rem] text-slate-500">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xs font-semibold text-slate-800 mb-2">
              4. How much change can your org absorb?
            </h2>
            <p className="text-[0.75rem] text-slate-500 mb-3">
              This controls the pace and parallelism of the roadmap.
            </p>
            <div className="space-y-2">
              {[
                {
                  id: "low",
                  label: "Limited",
                  desc: "Roughly 1 major program per quarter.",
                },
                {
                  id: "normal",
                  label: "Normal",
                  desc: "2–3 major programs per quarter.",
                },
                {
                  id: "high",
                  label: "High",
                  desc: "Multiple parallel tracks are realistic.",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCapacity(opt.id as ChangeCapacity)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                    capacity === opt.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[0.7rem] text-slate-500">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Sacred systems */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-800 mb-2">
            5. What systems are untouchable (for now)?
          </h2>
          <p className="text-[0.75rem] text-slate-500 mb-3">
            Name systems you cannot replace in this horizon (e.g. Oracle EBS,
            SAP ECC). Fuxi will design around them instead of trying to rip
            them out.
          </p>
          <textarea
            value={sacredSystemsText}
            onChange={(e) => setSacredSystemsText(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="One per line, e.g.&#10;Oracle EBS&#10;SAP ECC&#10;Custom logistics platform"
          />
        </Card>

        {/* Opportunity zones */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-800 mb-2">
            6. Where are you most open to transformation?
          </h2>
          <p className="text-[0.75rem] text-slate-500 mb-3">
            These zones will be weighted heavier in the first wave of
            recommendations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OPPORTUNITY_ZONES.map((z) => {
              const active = zones.includes(z.id);
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => toggleZone(z.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span>{z.label}</span>
                  {active && (
                    <span className="text-[0.65rem] font-semibold">
                      Focus
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <h2 className="text-xs font-semibold text-slate-800 mb-2">
            Anything else Fuxi should know?
          </h2>
          <p className="text-[0.75rem] text-slate-500 mb-3">
            Optional: constraints, upcoming events, politics, vendors you love
            or hate… it all helps shape the roadmap.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[80px] rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. 'Magento sunset in 18 months', 'Global rebrand in Q3', 'No more niche vendors', 'Board wants clear cost takeout story'..."
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[0.7rem] text-slate-500">
            {savedOnce ? (
              <span>Draft saved locally in this session (console only for now).</span>
            ) : (
              <span>We&apos;ll wire this into persistence in a later pass.</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={!canContinue()}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-xs font-medium text-slate-50 hover:bg-slate-800 disabled:opacity-40"
              onClick={() => {
                console.log("[INTAKE] Continue to next step");
                // Future: navigate to tech stack, portfolio optimizer, etc.
              }}
            >
              Continue to Tech Stack
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
