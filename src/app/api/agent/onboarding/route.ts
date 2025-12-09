import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type Intent = {
  id: string;
  prompt: string;
  next?: string | null;
};

type OnboardingSession = {
  context: string;
  projectId: string;
  answers: Record<string, string>;
  completed: boolean;
  behavioralInsights: {
    questionCount: number;
    goalFocus?: string;
    motivationIndicators: string[];
  };
};

type AggregatedAnalytics = {
  totalSessions: number;
  avgQuestions: number;
  goalFocusCounts: Record<string, number>;
  motivationSignals: Record<string, number>;
  lastUpdated: string;
};

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SESSION_DIR = path.join(DATA_ROOT, "sessions", "onboarding");
const ANALYTICS_FILE = path.join(SESSION_DIR, "behavioral_analytics.json");
const INTENTS_FILE = path.join(DATA_ROOT, "agent", "context", "intents", "onboarding.json");
const DEFAULT_INTENTS: Intent[] = [
  { id: "goal", prompt: "What’s your primary goal? (Modernize, Optimize, Reduce Cost, Accelerate AI)", next: "artifact_plan" },
  {
    id: "artifact_plan",
    prompt: "Do you want to upload inventory/current/future CSVs now, or start with manual entry?",
    next: "roi_priority",
  },
  { id: "roi_priority", prompt: "Should I open the ROI dashboard with default assumptions, or wait until after ingestion?", next: null },
];

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true }).catch(() => {});
}

async function loadJSON<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function saveJSON(file: string, data: unknown) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, userInput } = await req.json();
    if (!projectId || !userInput) {
      return NextResponse.json({ error: "projectId and userInput are required" }, { status: 400 });
    }

    await ensureDir(SESSION_DIR);

    const intentPayload = await loadJSON<unknown>(INTENTS_FILE, DEFAULT_INTENTS);
    const intents: Intent[] = Array.isArray(intentPayload)
      ? (intentPayload as Intent[])
      : Array.isArray((intentPayload as any)?.intents)
        ? ((intentPayload as any).intents as Intent[])
        : DEFAULT_INTENTS;

    const sessionFile = path.join(SESSION_DIR, `${projectId}.json`);
    let session = await loadJSON<OnboardingSession | null>(sessionFile, null);
    if (!session) {
      session = {
        context: "onboarding",
        projectId,
        answers: {},
        completed: false,
        behavioralInsights: { questionCount: 0, motivationIndicators: [] },
      };
    }

    const answeredKeys = Object.keys(session.answers);
    const currentIntent = intents.find((intent) => !answeredKeys.includes(intent.id));

    if (currentIntent) {
      session.answers[currentIntent.id] = userInput;
      session.behavioralInsights.questionCount += 1;

      const lower = String(userInput).toLowerCase();
      if (currentIntent.id === "goal") {
        session.behavioralInsights.goalFocus = lower;
      }
      if (lower.includes("innovate") || lower.includes("transform")) {
        session.behavioralInsights.motivationIndicators.push("transformative_mindset");
      }
      if (lower.includes("optimize") || lower.includes("efficiency")) {
        session.behavioralInsights.motivationIndicators.push("optimization_focus");
      }
    }

    const nextIntentId = currentIntent?.next;
    const nextIntent = intents.find((intent) => intent.id === nextIntentId);
    const nextPrompt = nextIntent?.prompt ?? "That concludes onboarding for now.";

    if (!nextIntent) {
      session.completed = true;
    }

    await saveJSON(sessionFile, session);

    // analytics
    const analytics = await loadJSON<AggregatedAnalytics>(ANALYTICS_FILE, {
      totalSessions: 0,
      avgQuestions: 0,
      goalFocusCounts: {},
      motivationSignals: {},
      lastUpdated: new Date().toISOString(),
    });

    analytics.totalSessions += 1;
    analytics.avgQuestions =
      (analytics.avgQuestions * (analytics.totalSessions - 1) + session.behavioralInsights.questionCount) /
      analytics.totalSessions;

    if (session.behavioralInsights.goalFocus) {
      const goal = session.behavioralInsights.goalFocus;
      analytics.goalFocusCounts[goal] = (analytics.goalFocusCounts[goal] || 0) + 1;
    }

    session.behavioralInsights.motivationIndicators.forEach((signal) => {
      analytics.motivationSignals[signal] = (analytics.motivationSignals[signal] || 0) + 1;
    });
    analytics.lastUpdated = new Date().toISOString();

    await saveJSON(ANALYTICS_FILE, analytics);

    return NextResponse.json({
      nextPrompt,
      session,
      analyticsSnapshot: analytics,
      telemetry: {
        event: "onboarding_step_completed",
        timestamp: new Date().toISOString(),
        projectId,
        step: currentIntent?.id,
      },
    });
  } catch (err: any) {
    console.error("[D067] onboarding intent handler error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
