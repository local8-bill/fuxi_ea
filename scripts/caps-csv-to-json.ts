// scripts/caps-csv-to-json.ts
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

type Scores = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};

type Row = {
  id: string;
  domain: string;
  level: "L2" | "L3" | "L4";
  l1: string;
  l2?: string;
  l3?: string;
  l4?: string;
  name: string;
  parentId?: string;
  maturity?: string;
  techFit?: string;
  strategicAlignment?: string;
  peopleReadiness?: string;
  opportunity?: string;
};

const SRC = path.join(process.cwd(), "src/data/deckers.csv");
const OUT = path.join(process.cwd(), "src/data/capabilities.json");

const csv = fs.readFileSync(SRC, "utf8");
const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Row[];

const num = (v?: string) => (v?.trim() ? Number(v) : undefined);

const data = rows.map((r) => {
  const scores: Partial<Scores> = {
    maturity: num(r.maturity),
    techFit: num(r.techFit),
    strategicAlignment: num(r.strategicAlignment),
    peopleReadiness: num(r.peopleReadiness),
    opportunity: num(r.opportunity),
  };
  const hasScores = Object.values(scores).some((v) => typeof v === "number");

  return {
    id: r.id.trim(),
    domain: r.domain.trim(),
    level: r.level,
    l1: r.l1?.trim(),
    l2: r.l2?.trim() || undefined,
    l3: r.l3?.trim() || undefined,
    l4: r.l4?.trim() || undefined,
    name: r.name.trim(),
    parentId: r.parentId?.trim() || undefined,
    ...(hasScores ? { scores } : {}),
  };
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
console.log(`Wrote ${data.length} capabilities to ${OUT}`);