"use client";

import type { Capability } from "@/domain/model/capability";
import type { Weights } from "@/domain/services/scoring";
import { CapabilityAccordionCard } from "./CapabilityAccordionCard";

export type CapabilitySummary = {
  id: string;
  name: string;
  domain: string;
  score: number;
  raw: Capability;
};

type Props = {
  sorted: CapabilitySummary[];
  grouped: Record<string, CapabilitySummary[]> | null;
  domainFilter: string;
  weights: Weights;
  expandedL1: Record<string, boolean>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  compositeFor: (cap: Capability) => number;
};

export function CapabilitySection({
  sorted,
  grouped,
  domainFilter,
  weights,
  expandedL1,
  onToggle,
  onOpen,
  compositeFor,
}: Props) {
  const renderGrid = (caps: CapabilitySummary[]) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {caps.map((cap) => (
        <CapabilityAccordionCard
          key={cap.id}
          cap={cap.raw}
          l1Score={cap.score}
          weights={weights}
          expanded={!!expandedL1[cap.id]}
          onToggle={() => onToggle(cap.id)}
          onOpen={onOpen}
          compositeFor={compositeFor}
        />
      ))}
    </div>
  );

  if (domainFilter === "All Domains" && grouped) {
    return (
      <>
        {Object.entries(grouped).map(([domain, caps]) => (
          <section key={domain} className="mb-6">
            <h2 className="text-base font-semibold mb-3">{domain}</h2>
            {renderGrid(caps)}
          </section>
        ))}
      </>
    );
  }

  return renderGrid(sorted);
}
