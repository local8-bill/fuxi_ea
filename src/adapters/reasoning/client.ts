export type AlignRow = { id?:string; name:string; level:string; domain?:string; parent?:string };
export type AlignResult = {
  suggestions: Record<string, string[]>; // incoming L1 -> candidate matches
  issues: string[];                       // human-readable notes
};

export async function alignViaApi(rows: AlignRow[], existingL1: string[]): Promise<AlignResult> {
  const res = await fetch("/api/reasoning/align", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rows, existingL1 }),
  });
  if (!res.ok) throw new Error(`Reasoning API ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "align error");
  return json.result as AlignResult;
}