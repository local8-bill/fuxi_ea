export type AggressionLevel = "low" | "medium" | "high" | null;

export interface ProjectIntake {
  projectId: string;
  industry: string | null;
  drivers: string[];         // e.g. ["simplify", "modernize", "grow"]
  aggression: AggressionLevel;
  constraints: string[];     // free-form constraints from intake
  untouchables: string[];    // systems / platforms that cannot move
  notes?: string | null;
}

export interface PortfolioSignals {
  projectId: string;

  // High-level summary
  goalSummary: string;
  changePosture: string;

  // Where to focus vs where to be careful
  focusAreas: string[];
  guardrails: string[];

  // How we will talk about the portfolio play
  suggestedThemes: string[]; // e.g. ["Simplification", "Modernization"]

  // Narrative bullets we can surface in the UI / AI copy
  commentary: string[];
}

/**
 * Small helper to normalize driver strings.
 */
function normalizeDriver(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Build a human-readable summary of the primary goals.
 */
function deriveGoalSummary(intake: ProjectIntake | null): string {
  if (!intake || !intake.drivers || intake.drivers.length === 0) {
    return "No primary portfolio goals captured yet.";
  }

  const normalized = Array.from(
    new Set(intake.drivers.map(normalizeDriver))
  );

  const labels: string[] = [];

  if (normalized.includes("simplify") || normalized.includes("rationalize")) {
    labels.push("simplify the technology portfolio");
  }
  if (normalized.includes("modernize") || normalized.includes("transform")) {
    labels.push("modernize core platforms and capabilities");
  }
  if (
    normalized.includes("grow") ||
    normalized.includes("revenue") ||
    normalized.includes("scale")
  ) {
    labels.push("drive revenue and growth through technology");
  }

  if (labels.length === 0) {
    return "Portfolio goals captured, but not yet mapped to simplification, modernization or growth.";
  }

  if (labels.length === 1) {
    return `Primary goal is to ${labels[0]}.`;
  }

  const last = labels.pop();
  return `Primary goals are to ${labels.join(", ")} and ${last}.`;
}

/**
 * Translate aggression level + constraints into a posture sentence.
 */
function deriveChangePosture(intake: ProjectIntake | null): string {
  const level = intake?.aggression ?? null;
  const hasConstraints = (intake?.constraints?.length ?? 0) > 0;
  const hasUntouchables = (intake?.untouchables?.length ?? 0) > 0;

  if (!level && !hasConstraints && !hasUntouchables) {
    return "Change posture is not yet defined — treat this portfolio as neutral until guided otherwise.";
  }

  if (level === "low") {
    if (hasUntouchables) {
      return "Low appetite for change with several untouchable platforms — favor incremental moves and guard critical systems carefully.";
    }
    return "Low appetite for change — prioritize incremental simplification and risk reduction over big bets.";
  }

  if (level === "medium") {
    if (hasUntouchables) {
      return "Balanced appetite for change with some untouchable platforms — modernize around the edges while keeping the core stable.";
    }
    return "Balanced appetite for change — room for meaningful modernization as long as risk is controlled.";
  }

  if (level === "high") {
    if (hasUntouchables) {
      return "High appetite for change, but with sacred platforms in place — push hard on everything except the untouchables.";
    }
    return "High appetite for change — portfolio is a candidate for aggressive simplification and modernization moves.";
  }

  // fallback
  return "Change posture is mixed — use simplification and modernization recommendations as a starting point, but validate with stakeholders.";
}

/**
 * Determine focus areas from drivers + industry.
 */
function deriveFocusAreas(intake: ProjectIntake | null): string[] {
  if (!intake) return ["Capture more intake detail to sharpen where to focus."];

  const drivers = new Set((intake.drivers ?? []).map(normalizeDriver));
  const out: string[] = [];

  if (drivers.has("simplify") || drivers.has("rationalize")) {
    out.push("application and vendor overlap");
  }

  if (drivers.has("modernize") || drivers.has("transform")) {
    out.push("core platforms and integration backbone");
  }

  if (drivers.has("grow") || drivers.has("revenue") || drivers.has("scale")) {
    out.push("digital revenue engines (commerce, data, personalization)");
  }

  const industry = (intake.industry ?? "").toLowerCase();
  if (industry.includes("retail") || industry.includes("commerce")) {
    out.push("commerce, supply chain, and customer experience platforms");
  } else if (industry.includes("manufacturing")) {
    out.push("planning, supply chain visibility, and shop-floor systems");
  }

  if (out.length === 0) {
    out.push("clarify portfolio goals to identify priority focus areas.");
  }

  return out;
}

/**
 * Guardrails come primarily from constraints + untouchables.
 */
function deriveGuardrails(intake: ProjectIntake | null): string[] {
  if (!intake) {
    return ["Do not propose moves that conflict with regulatory or contractual obligations."];
  }

  const result: string[] = [];

  if (intake.untouchables.length > 0) {
    const sample = intake.untouchables.slice(0, 5).join(", ");
    result.push(
      `Treat the following as untouchable or near-untouchable platforms in the near term: ${sample}.`
    );
  }

  if (intake.constraints.length > 0) {
    result.push(
      "Respect the stated financial, regulatory, and resource constraints when suggesting any large platform move."
    );
  }

  if (result.length === 0) {
    result.push("No hard guardrails captured yet — validate appetite for major moves before committing a roadmap.");
  }

  return result;
}

/**
 * Turn drivers into high-level "themes" we can show as chips / badges.
 */
function deriveThemes(intake: ProjectIntake | null): string[] {
  if (!intake) return [];

  const drivers = new Set((intake.drivers ?? []).map(normalizeDriver));
  const themes: string[] = [];

  if (drivers.has("simplify") || drivers.has("rationalize")) {
    themes.push("Simplification");
  }
  if (drivers.has("modernize") || drivers.has("transform")) {
    themes.push("Modernization");
  }
  if (drivers.has("grow") || drivers.has("revenue") || drivers.has("scale")) {
    themes.push("Growth");
  }

  // Always keep them stable and de-duplicated
  return Array.from(new Set(themes));
}

/**
 * Commentary bullets – this is what we’ll eventually feed into AI to expand.
 */
function deriveCommentary(intake: ProjectIntake | null): string[] {
  const bullets: string[] = [];

  if (!intake) {
    bullets.push(
      "Intake details are incomplete — capture industry, portfolio goals, and change appetite to unlock more targeted recommendations."
    );
    return bullets;
  }

  bullets.push(
    "Use this view as a portfolio-level conversation starter with business leadership, not just an architecture artifact."
  );

  if (intake.drivers.length > 0) {
    bullets.push(
      "Align the next 12–18 months of investment to the stated portfolio drivers rather than opportunistic project requests."
    );
  }

  if (intake.untouchables.length > 0) {
    bullets.push(
      "Design modernization and simplification moves around the untouchable platforms rather than fighting them head-on."
    );
  }

  if (intake.aggression === "high") {
    bullets.push(
      "Given the high appetite for change, prioritize bold moves that consolidate platforms and remove legacy anchors."
    );
  } else if (intake.aggression === "low") {
    bullets.push(
      "Given the low appetite for change, focus first on reducing overlap and operational drag before large-scale replatforming."
    );
  }

  if (intake.notes && intake.notes.trim().length > 0) {
    bullets.push("There are additional context notes captured in intake — review them before finalizing key moves.");
  }

  return bullets;
}

/**
 * Main entry point: given the current intake snapshot,
 * derive the portfolio signals that the UI / AI can use.
 */
export function buildPortfolioSignalsFromIntake(
  intake: ProjectIntake | null
): PortfolioSignals {
  const projectId = intake?.projectId ?? "unknown";

  return {
    projectId,
    goalSummary: deriveGoalSummary(intake),
    changePosture: deriveChangePosture(intake),
    focusAreas: deriveFocusAreas(intake),
    guardrails: deriveGuardrails(intake),
    suggestedThemes: deriveThemes(intake),
    commentary: deriveCommentary(intake),
  };
}
