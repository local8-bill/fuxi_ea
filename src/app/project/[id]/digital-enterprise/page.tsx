"use client";

import React from "react";
import { useParams } from "next/navigation";

type Stats = {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected: number;
};

type ApiResponse =
  | { ok: true; stats: Stats }
  | { ok: false; error: string };

export default function DigitalEnterprisePage() {
  const { id } = useParams<{ id: string }>();

  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [raw, setRaw] = React.useState<any>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/digital-enterprise/stats?project=${encodeURIComponent(id)}`,
        );

        const json = await res.json().catch(() => null);
        if (!cancelled) {
          setRaw(json);
        }

        if (!res.ok || !json || json.ok === false || !("stats" in json)) {
          console.error("digital-enterprise/stats bad payload", res.status, json);
          if (!cancelled) {
            setError("No stats available yet. Upload a Lucid CSV first.");
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setStats(json.stats as Stats);
          setLoading(false);
        }
      } catch (err) {
        console.error("digital-enterprise/stats fetch error", err);
        if (!cancelled) {
          setError("Failed to load ecosystem stats.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const systemsFuture = stats?.systemsFuture ?? 0;
  const integrationsFuture = stats?.integrationsFuture ?? 0;
  const domainsDetected = stats?.domainsDetected ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
          DIGITAL ENTERPRISE
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Future-State Ecosystem for Project: {id}
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          These metrics are derived directly from your Lucid architecture diagram.
          We count unique systems that participate in at least one connection and
          their system-to-system integrations.
        </p>
      </header>

      {loading && (
        <div className="card border border-gray-200 p-4 text-sm text-slate-600">
          Loading ecosystem metrics…
        </div>
      )}

      {!loading && error && (
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Systems (Future)
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {systemsFuture}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Unique labeled systems that participate in at least one connection.
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Integrations (Future)
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {integrationsFuture}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Unique system-to-system connections from the diagram.
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Domains Detected
              </div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {domainsDetected}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Domain grouping will evolve into ecosystem clusters in a later pass.
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4 text-xs text-slate-500">
            <div className="font-semibold mb-1">Debug payload</div>
            <pre className="mt-2 max-h-64 overflow-auto text-[10px] whitespace-pre-wrap">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
