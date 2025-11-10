// Small browser helper to call our /api/vision/analyze endpoint.

export type ClientRow = {
  name: string;
  level: "L1" | "L2" | "L3";
  domain?: string;
  parent?: string;
};

export async function analyzeImageViaApi(file: File): Promise<ClientRow[]> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/vision/analyze", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Vision analyze failed (${res.status})`);
  }

  const data = (await res.json()) as { rows: ClientRow[] };
  return Array.isArray(data?.rows) ? data.rows : [];
}
