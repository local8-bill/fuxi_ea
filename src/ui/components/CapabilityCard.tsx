import { colorBand } from "@/domain/services/colorBand";

export function CapabilityCard({
  name,
  domain,
  score,
  onOpen,
}: {
  name: string;
  domain?: string;
  score: number; // 0..1
  onOpen?: () => void;
}) {
  const band = colorBand(score);

  return (
    <button
      onClick={onOpen}
      className={`card text-left transition hover:shadow-md hover:-translate-y-[1px] ${band.band}`}
      style={{ borderWidth: 1 }}
      aria-label={`${name} ${Math.round(score * 100)}/100`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{name}</div>
          {domain && (
            <div className="text-xs opacity-70 mt-1">{domain}</div>
          )}
        </div>

        <div
          className="badge shrink-0"
          title="Composite score"
          style={{
            background: "white",
            borderColor: "rgba(229,231,235,1)",
          }}
        >
          {Math.round(score * 100)}/100
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-[rgba(229,231,235,.6)] overflow-hidden">
        <div
          className="h-full"
          style={{
            width: `${Math.max(0, Math.min(100, Math.round(score * 100)))}%`,
            background:
              band.band === "band-low"
                ? "rgba(244, 63, 94, .6)"
                : band.band === "band-med"
                ? "rgba(234, 179, 8, .7)"
                : band.band === "band-high"
                ? "rgba(34, 197, 94, .7)"
                : "rgba(59, 130, 246, .7)",
          }}
        />
      </div>
    </button>
  );
}