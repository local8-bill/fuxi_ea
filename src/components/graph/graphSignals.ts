type SignalInput = {
  roi?: number | null;
  tcc?: number | null;
};

function normalizePercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.abs(value) <= 1 ? value * 100 : value;
}

export function getRoiSignalColor({ roi, tcc }: SignalInput): string {
  const normalizedRoi = normalizePercent(roi);
  if (typeof tcc === "number") {
    if (tcc >= 5) return "#FCA5A5";
    if (tcc <= 2) return "#A7F3D0";
  }
  if (normalizedRoi != null) {
    if (normalizedRoi > 50) return "#34D399";
    if (normalizedRoi >= 0) return "#FCD34D";
    return "#F87171";
  }
  return "#E5E7EB";
}

export function shouldPulseRoi(roi?: number | null) {
  return typeof roi === "number" && !Number.isNaN(roi);
}
