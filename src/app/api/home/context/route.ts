import { NextRequest, NextResponse } from "next/server";
import { readHomeSession, writeHomeSession, type HomeSessionState } from "@/lib/home/sessionStore";

export const runtime = "nodejs";

type HomeSuggestion = {
  id: string;
  label: string;
  description: string;
  action: "resume" | "onboarding" | "demo" | "help";
  topic?: string;
};

type HomeContext = {
  session: HomeSessionState;
  userType: "first_time" | "returning";
  prompt: string;
  suggestions: HomeSuggestion[];
};

const buildPrompt = (session: HomeSessionState): { prompt: string; suggestions: HomeSuggestion[]; userType: "first_time" | "returning" } => {
  const isFirst = session.firstTime || !session.lastSeen;
  if (isFirst) {
    return {
      userType: "first_time",
      prompt: "I can help you map systems, harmonize data, or model ROI. Would you like a walkthrough or to jump right in?",
      suggestions: [
        {
          id: "start-onboarding",
          label: "Start guided onboarding",
          description: "Upload inventory and set objectives so I can tailor recommendations.",
          action: "onboarding",
        },
        {
          id: "launch-demo",
          label: "See how the demo works",
          description: "Watch me narrate a harmonization + ROI walkthrough before you try it yourself.",
          action: "demo",
        },
      ],
    };
  }
  return {
    userType: "returning",
    prompt: `You left off in ${session.lastStage ?? "the command deck"}. Ready to resume ${session.lastIntent ?? "the last action"}?`,
    suggestions: [
      {
        id: "resume-work",
        label: "Resume where I left off",
        description: `Open ${session.lastStage ?? "command deck"} with context intact.`,
        action: "resume",
      },
      {
        id: "demo-refresh",
        label: "Walk me through it again",
        description: "Narrate the harmonization → ROI demo using my data.",
        action: "demo",
      },
    ],
  };
};

export async function GET() {
  const session = await readHomeSession();
  const { prompt, suggestions, userType } = buildPrompt(session);
  const context: HomeContext = {
    session,
    prompt,
    suggestions,
    userType,
  };
  return NextResponse.json(context);
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Partial<HomeSessionState>;
    const updated = await writeHomeSession(payload);
    return NextResponse.json({ ok: true, session: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Failed to persist" }, { status: 400 });
  }
}
