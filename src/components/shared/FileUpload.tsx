"use client";

import { useState } from "react";

interface FileUploadProps {
  label: string;
  onFileSelected: (file: File) => Promise<void> | void;
}

/**
 * Simple shared file upload:
 * - Single native file input
 * - Label above it
 * - Calls onFileSelected(file) on change
 */
export function FileUpload({ label, onFileSelected }: FileUploadProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      await onFileSelected(file);
      // clear the input so the same file can be re-selected if needed
      e.target.value = "";
    } catch (err: any) {
      console.error("[FileUpload] error", err);
      setError(err?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label
        htmlFor="fuxi-lucid-upload-input"
        className="text-xs text-gray-700"
      >
        {label}
      </label>
      <input
        id="fuxi-lucid-upload-input"
        type="file"
        disabled={busy}
        onChange={handleChange}
        className="text-xs"
      />
      {error && (
        <span className="text-[0.65rem] text-red-500 max-w-xs text-right">
          {error}
        </span>
      )}
    </div>
  );
}
