export interface InventoryStats {
  projectId: string;
  rowCount: number;
  uniqueSystems: number;
}

export interface InventoryUploadResponse {
  ok: boolean;
  projectId: string;
  rowCount: number;
  uniqueSystems: number;
  stats?: InventoryStats;
  error?: string;
  detail?: string;
}

/**
 * Upload an inventory spreadsheet exported as CSV.
 * We rely solely on the upload response for stats.
 */
export async function uploadInventorySpreadsheet(
  projectId: string,
  file: File
): Promise<InventoryUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    "/api/inventory/upload?project=" + encodeURIComponent(projectId),
    {
      method: "POST",
      body: formData,
    }
  );

  const json = (await res.json()) as InventoryUploadResponse;

  if (!res.ok || !json.ok) {
    throw new Error(
      json.error || "Inventory upload failed (" + res.status + ")"
    );
  }

  return json;
}
