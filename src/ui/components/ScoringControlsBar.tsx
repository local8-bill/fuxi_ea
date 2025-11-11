"use client";

type Props = {
  domainFilter: string;
  domains: string[];
  sortKey: "name" | "score";
  onDomainChange: (value: string) => void;
  onSortChange: (value: "name" | "score") => void;
  onAddL1: () => void;
  onOpenWeights: () => void;
};

export function ScoringControlsBar({
  domainFilter,
  domains,
  sortKey,
  onDomainChange,
  onSortChange,
  onAddL1,
  onOpenWeights,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-6">
      <select
        className="select"
        value={domainFilter}
        onChange={(e) => onDomainChange(e.target.value)}
      >
        <option>All Domains</option>
        {domains.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <select
        className="select"
        value={sortKey}
        onChange={(e) => onSortChange(e.target.value as "name" | "score")}
      >
        <option value="name">Sort: Name</option>
        <option value="score">Sort: Score</option>
      </select>

      <button className="btn" onClick={onAddL1}>
        Add L1
      </button>

      <button className="btn ml-auto" onClick={onOpenWeights}>
        Weights
      </button>
    </div>
  );
}
