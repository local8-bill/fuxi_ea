// Small browser helper to call our /api/vision/analyze endpoint.

export type ClientRow = {
  name: string;
  level: "L1" | "L2" | "L3";
  domain?: string;
  parent?: string;
};

const clientAuthHeader = process.env.NEXT_PUBLIC_FUXI_API_TOKEN
  ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_FUXI_API_TOKEN}` }
  : undefined;

export async function analyzeImageViaApi(file: File): Promise<ClientRow[]> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/vision/analyze", {
    method: "POST",
    body: form,
    headers: clientAuthHeader ?? undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Vision analyze failed (${res.status})`);
  }

  const data = (await res.json()) as { rows: ClientRow[] };
  return Array.isArray(data?.rows) ? data.rows : [];
}
