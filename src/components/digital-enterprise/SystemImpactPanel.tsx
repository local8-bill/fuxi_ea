// src/components/digital-enterprise/SystemImpactPanel.tsx

"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";

interface ImpactNeighbor {
  name: string;
  degree: number;
  isChanging?: boolean;
}

export interface SystemImpact {
  systemName: string;

  totalDegree: number;
  upstreamCount: number;
  downstreamCount: number;

  upstream: ImpactNeighbor[];
  downstream: ImpactNeighbor[];
}

interface SystemImpactPanelProps {
  impact: SystemImpact | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
  actions?: ReactNode;
}

export function SystemImpactPanel({
  impact,
  loading = false,
  error = null,
  className,
  actions,
}: SystemImpactPanelProps) {
  if (loading) {
    return (
      <Card className={className}>
        <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
          IMPACT
        </p>
        <p className="text-sm text-gray-500">Loading impact analysis…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
          IMPACT
        </p>
        <p className="text-sm text-red-500">{error}</p>
      </Card>
    );
  }

  if (!impact) {
    return (
      <Card className={className}>
        <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
          IMPACT
        </p>
        <p className="text-sm text-gray-500">
          Select a system to see upstream and downstream impact.
        </p>
      </Card>
    );
  }

  const {
    systemName,
    totalDegree,
    upstreamCount,
    downstreamCount,
    upstream,
    downstream,
  } = impact;

  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
            IMPACT
          </p>
          <h2 className="text-lg font-semibold mb-1">{systemName}</h2>
          <p className="text-xs text-gray-500 max-w-md">
            Upstream and downstream dependencies inferred from the architecture graph.
          </p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <MetricCard
          label="TOTAL INTEGRATIONS"
          value={totalDegree}
          description="Combined upstream and downstream connections."
        />
        <MetricCard
          label="UPSTREAM SYSTEMS"
          value={upstreamCount}
          description="Systems that feed into this system."
        />
        <MetricCard
          label="DOWNSTREAM SYSTEMS"
          value={downstreamCount}
          description="Systems that depend on this system."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImpactList
          title="UPSTREAM"
          items={upstream}
          emptyMessage="No upstream systems detected."
        />
        <ImpactList
          title="DOWNSTREAM"
          items={downstream}
          emptyMessage="No downstream systems detected."
        />
      </div>
    </Card>
  );
}

interface ImpactListProps {
  title: string;
  items: ImpactNeighbor[];
  emptyMessage: string;
}

function ImpactList({ title, items, emptyMessage }: ImpactListProps) {
  return (
    <div>
      <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="text-xs text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-gray-50/40">
          {items.map((n, idx) => (
            <div
              key={`${title}-${n.name}-${idx}`}
              className="flex items-center justify-between px-3 py-2"
            >
              <div>
                <p className="text-xs font-medium text-gray-800">{n.name}</p>
                <p className="text-[0.65rem] text-gray-500">
                  Integrations: {n.degree}
                </p>
              </div>

              {n.isChanging && (
                <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-50 px-2 py-[2px] text-[0.6rem] font-medium text-amber-700">
                  Changing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
