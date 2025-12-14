import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// --- D067 Conversational Onboarding Intent Handler ---
// Purpose: Manage adaptive onboarding flow via ConversationalAgent.
// Scope: Handles user inputs, routes next prompt, persists answers, and collects ethical behavioral insights.
// Notes: Ensures analytics persistence across restarts by maintaining durable JSON files under /data/sessions.

const sessionDir = path.join(process.cwd(), 'data/sessions');
const analyticsFile = path.join(sessionDir, 'behavioral_analytics.json');
const onboardingIntentsPath = path.join(process.cwd(), 'api/agent/context/intents/onboarding.json');

// Ensure persistence directory exists
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// Initialize analytics file if missing
if (!fs.existsSync(analyticsFile)) {
  const initialAnalytics = {
    totalSessions: 0,
    avgQuestions: 0,
    goalFocusCounts: {},
    motivationSignals: {},
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(analyticsFile, JSON.stringify(initialAnalytics, null, 2), 'utf8');
}

interface OnboardingSession {
  context: string;
  projectId: string;
  answers: Record<string, string>;
  completed: boolean;
  behavioralInsights?: {
    questionCount: number;
    goalFocus?: string;
    motivationIndicators?: string[];
  };
}

interface AggregatedAnalytics {
  totalSessions: number;
  avgQuestions: number;
  goalFocusCounts: Record<string, number>;
  motivationSignals: Record<string, number>;
  lastUpdated: string;
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, userInput } = await req.json();
    const sessionFile = path.join(sessionDir, `${projectId}.json`);

    // Load existing session or create new one
    let session: OnboardingSession;
    if (fs.existsSync(sessionFile)) {
      session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    } else {
      session = { context: 'onboarding', projectId, answers: {}, completed: false, behavioralInsights: { questionCount: 0, motivationIndicators: [] } };
    }
    if (!session.behavioralInsights) {
      session.behavioralInsights = { questionCount: 0, motivationIndicators: [] };
    } else if (!session.behavioralInsights.motivationIndicators) {
      session.behavioralInsights.motivationIndicators = [];
    }

    // Load intents
    const intents = JSON.parse(fs.readFileSync(onboardingIntentsPath, 'utf8'));

    // Identify current step
    const answeredKeys = Object.keys(session.answers);
    const currentIntent = intents.find((intent: any) => !answeredKeys.includes(intent.id));

    // Record answer and ethically infer non-personal behavior insights
    if (currentIntent) {
      session.answers[currentIntent.id] = userInput;
      session.behavioralInsights.questionCount += 1;

      if (currentIntent.id === 'goal') {
        session.behavioralInsights.goalFocus = userInput.toLowerCase();
      }

      if (userInput.toLowerCase().includes('innovate') || userInput.toLowerCase().includes('transform')) {
        session.behavioralInsights.motivationIndicators?.push('transformative_mindset');
      }
      if (userInput.toLowerCase().includes('optimize') || userInput.toLowerCase().includes('efficiency')) {
        session.behavioralInsights.motivationIndicators?.push('optimization_focus');
      }
    }

    // Determine next prompt
    const nextIntent = intents.find((intent: any) => intent.id === currentIntent?.next);
    let nextPrompt = nextIntent?.prompt || 'That concludes onboarding for now.';

    // Mark completion
    if (!nextIntent) {
      session.completed = true;
    }

    // Persist session data
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2), 'utf8');

    // --- Aggregate anonymized behavioral analytics ---
    let analytics: AggregatedAnalytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));

    analytics.totalSessions += 1;
    analytics.avgQuestions =
      (analytics.avgQuestions * (analytics.totalSessions - 1) + session.behavioralInsights.questionCount) /
      analytics.totalSessions;

    if (session.behavioralInsights.goalFocus) {
      const goal = session.behavioralInsights.goalFocus;
      analytics.goalFocusCounts[goal] = (analytics.goalFocusCounts[goal] || 0) + 1;
    }

    session.behavioralInsights.motivationIndicators?.forEach((signal) => {
      analytics.motivationSignals[signal] = (analytics.motivationSignals[signal] || 0) + 1;
    });

    analytics.lastUpdated = new Date().toISOString();

    fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2), 'utf8');

    // Return structured response
    return NextResponse.json({
      nextPrompt,
      session,
      analyticsSnapshot: analytics,
      telemetry: {
        event: 'onboarding_step_completed',
        timestamp: new Date().toISOString(),
        projectId,
        step: currentIntent?.id,
      },
    });
  } catch (err: any) {
    console.error('Error in onboarding intent handler:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
