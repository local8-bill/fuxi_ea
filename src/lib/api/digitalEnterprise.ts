/**
 * Shared client-side helpers for Digital Enterprise APIs.
 * Use these instead of hand-rolling fetch logic on each page.
 */

export async function uploadLucidCsv(projectId: string, file: File) {
  const authHeader = process.env.NEXT_PUBLIC_FUXI_API_TOKEN
    ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_FUXI_API_TOKEN}` }
    : undefined;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `/api/digital-enterprise/lucid?project=${encodeURIComponent(projectId)}`,
    {
      method: "POST",
      body: formData,
      headers: authHeader,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("uploadLucidCsv failed", res.status, text);
    throw new Error(`Upload failed with status ${res.status}`);
  }

  return res.json(); // expected: { ok, projectId, stats }
}

export async function fetchDigitalEnterpriseStats(projectId: string) {
  const authHeader = process.env.NEXT_PUBLIC_FUXI_API_TOKEN
    ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_FUXI_API_TOKEN}` }
    : undefined;

  const res = await fetch(
    `/api/digital-enterprise/stats?project=${encodeURIComponent(projectId)}`,
    {
      cache: "no-store",
      headers: authHeader,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchDigitalEnterpriseStats failed", res.status, text);
    throw new Error(`Stats failed with status ${res.status}`);
  }

  return res.json();
}
