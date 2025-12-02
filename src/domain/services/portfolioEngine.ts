// Fuxi Portfolio Engine
// Turns intake answers (+ optional tech stats) into a portfolio-level narrative.

export interface ProjectIntake {
  projectId: string;
  industry: string | null;
  drivers: string[];          // e.g. ["cost", "growth", "experience"]
  aggression: string | null;  // e.g. "conservative" | "balanced" | "aggressive"
  constraints: string[];      // e.g. ["limited-budget", "hiring-freeze"]
  untouchables: string[];     // e.g. ["SAP", "Oracle EBS"]
  notes: string | null;
}

export interface PortfolioSignals {
  goalSummary: string;
  changePosture: string;
  suggestedThemes: string[];
  focusAreas: string[];
  guardrails: string[];
  commentary: string[];
}

function hasDriver(intake: ProjectIntake | null, key: string): boolean {
  if (!intake || !Array.isArray(intake.drivers)) return false;
  return intake.drivers.some((d) => d.toLowerCase() === key.toLowerCase());
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildPortfolioSignalsFromIntake(
  intake: ProjectIntake | null,
): PortfolioSignals {
  if (!intake) {
    return {
      goalSummary: "No primary portfolio goals captured yet.",
      changePosture:
        "Change posture not set — assume neutral until intake is completed.",
      suggestedThemes: [],
      focusAreas: [],
      guardrails: [],
      commentary: [],
    };
  }

  const { industry, aggression, constraints, untouchables, notes } = intake;
  const drivers = intake.drivers || [];

  // --- Goal summary ---
  const mainGoals: string[] = [];
  if (hasDriver(intake, "cost")) mainGoals.push("reduce structural tech cost");
  if (hasDriver(intake, "growth")) mainGoals.push("unlock revenue and growth");
  if (hasDriver(intake, "experience"))
    mainGoals.push("improve customer and partner experience");
  if (hasDriver(intake, "resilience"))
    mainGoals.push("improve resilience and reliability");
  if (mainGoals.length === 0) mainGoals.push("stabilise and clean up the stack");

  const industryPhrase = industry
    ? `For a ${industry.toLowerCase()} business, `
    : "";

  const goalSummary = `${industryPhrase}the portfolio should ${joinList(
    mainGoals,
  )}.`;

  // --- Change posture ---
  let changePosture = "Default to a balanced pace of change.";
  if (aggression === "conservative") {
    changePosture =
      "Operate with a conservative change posture — protect stability, sequence moves carefully, and avoid simultaneous high-risk bets.";
  } else if (aggression === "balanced") {
    changePosture =
      "Run a balanced change posture — mix foundation work with a few visible bets, but keep overall risk controlled.";
  } else if (aggression === "aggressive") {
    changePosture =
      "Lean into an aggressive posture — prioritize visible portfolio moves and be willing to refactor more of the stack than usual.";
  }

  // --- Themes ---
  const suggestedThemes: string[] = [];

  if (hasDriver(intake, "cost")) {
    suggestedThemes.push("Portfolio simplification & vendor rationalization");
  }
  if (hasDriver(intake, "growth")) {
    suggestedThemes.push("Digital growth & new revenue enablement");
  }
  if (hasDriver(intake, "experience")) {
    suggestedThemes.push("Customer & associate experience modernization");
  }
  if (hasDriver(intake, "resilience")) {
    suggestedThemes.push("Resilience, observability, and risk reduction");
  }
  if (suggestedThemes.length === 0) {
    suggestedThemes.push("Stabilize core platforms and reduce noise");
  }

  // --- Focus areas ---
  const focusAreas: string[] = [];

  if (hasDriver(intake, "experience")) {
    focusAreas.push(
      "Tighten the front-door stack (web, mobile, commerce) so journeys feel coherent.",
    );
  }
  if (hasDriver(intake, "growth")) {
    focusAreas.push(
      "Invest in data, experimentation, and personalization capabilities that directly support revenue.",
    );
  }
  if (hasDriver(intake, "cost")) {
    focusAreas.push(
      "Target overlapping platforms and redundant vendors for rationalization.",
    );
  }
  if (hasDriver(intake, "resilience")) {
    focusAreas.push(
      "Strengthen integration patterns, error handling, and observability around critical flows.",
    );
  }
  if (focusAreas.length === 0) {
    focusAreas.push(
      "Clarify a small number of visible portfolio moves that leadership can rally around.",
    );
  }

  // --- Guardrails ---
  const guardrails: string[] = [];

  if (constraints && constraints.length > 0) {
    guardrails.push(
      `Respect constraints called out in intake: ${joinList(constraints)}.`,
    );
  }

  if (untouchables && untouchables.length > 0) {
    guardrails.push(
      `Treat ${joinList(
        untouchables,
      )} as structural platforms — design around them rather than assuming replacement.`,
    );
  }

  if (guardrails.length === 0) {
    guardrails.push(
      "Agree explicit guardrails (budget envelope, change windows, and untouchable platforms) before committing to aggressive portfolio moves.",
    );
  }

  // --- Commentary / talk track ---
  const commentary: string[] = [];

  commentary.push(
    "Anchor the portfolio conversation in business outcomes, not tools — start with goals, then show how the stack helps or hurts.",
  );

  if (hasDriver(intake, "cost")) {
    commentary.push(
      "Quantify simplification opportunities by showing where multiple platforms compete in the same lane and sizing the potential savings.",
    );
  }
  if (hasDriver(intake, "growth")) {
    commentary.push(
      "Make sure at least one portfolio theme is explicitly tied to unlocking new revenue or channels.",
    );
  }
  if (hasDriver(intake, "experience")) {
    commentary.push(
      "Frame front-door changes in terms of customer and associate journeys rather than just UI rewrites.",
    );
  }
  if (hasDriver(intake, "resilience")) {
    commentary.push(
      "Highlight resilience work where outages, incident noise, or brittle integrations are already burning the team.",
    );
  }

  if (notes && notes.trim().length > 0) {
    commentary.push(
      `Incorporate the following client context into the narrative: ${notes.trim()}`,
    );
  }

  return {
    goalSummary,
    changePosture,
    suggestedThemes,
    focusAreas,
    guardrails,
    commentary,
  };
}
