import { promises as fs } from "fs";
import path from "path";

type SurveyQuestion =
  | { id: string; type: "rank" | "multi-select"; prompt: string; options: string[]; allowOther?: boolean }
  | { id: string; type: "text"; prompt: string }
  | { id: string; type: "likert"; prompt: string; scale: number; followup?: string };

type SurveyTemplate = {
  title: string;
  version: string;
  questions: SurveyQuestion[];
};

async function loadSurvey(): Promise<SurveyTemplate | null> {
  try {
    const filePath = path.join(process.cwd(), "src", "domain", "research", "templates", "survey_100days.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as SurveyTemplate;
  } catch (err) {
    console.warn("[RESEARCH] Unable to load survey template", err);
    return null;
  }
}

export default async function ResearchPage() {
  const survey = await loadSurvey();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">Research & Empathy Layer</h1>
      <p className="mt-1 text-sm text-slate-600">
        First 100 Days framework to capture C-level priorities. This prototype surfaces the v1 survey template and provides
        a starting point for interviews and workshops.
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Survey Template</div>
            <div className="text-xs text-slate-500">Path: src/domain/research/templates/survey_100days.json</div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            Version {survey?.version ?? "n/a"}
          </span>
        </div>

        {!survey && (
          <div className="mt-3 text-xs text-red-600">
            Survey template not found. Ensure the JSON exists at the expected path.
          </div>
        )}

        {survey && (
          <ol className="mt-4 space-y-3 text-sm text-slate-800">
            {survey.questions.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">{q.type.replace("-", " ")}</div>
                <div className="font-semibold">{q.prompt}</div>
                {"options" in q && q.options && (
                  <div className="mt-1 text-xs text-slate-600">Options: {q.options.join(", ")}</div>
                )}
                {"followup" in q && q.followup && (
                  <div className="mt-1 text-xs text-slate-600">Follow-up: {q.followup}</div>
                )}
                {"allowOther" in q && q.allowOther && (
                  <div className="mt-1 text-[11px] text-slate-500">Allows custom responses</div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Interview & Workshop Guide</div>
        <div className="mt-2 text-sm text-slate-700">
          See <code>docs/research/fuxi_executive_research_template.md</code> for the interview guide and workshop pattern.
          Capture findings in an insights log (future: hook into <code>.fuxi/data/research</code>).
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Next steps: wire a form to capture responses, persist to <code>.fuxi/data/research/responses.json</code>, and auto-tag insights.
        </div>
      </section>
    </div>
  );
}
