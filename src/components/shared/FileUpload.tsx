"use client";

import React, { useRef, useState } from "react";

interface FileUploadProps {
  label: string;
  onFileSelected: (file: File) => Promise<void> | void;
}

/**
 * Shared file upload control:
 * - Left-aligned pill button
 * - Shows selected filename
 * - Hides the native file input
 */
export function FileUpload({ label, onFileSelected }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("No file selected");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      await onFileSelected(file);
    } finally {
      // Allow re-uploading the same file if needed
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center rounded-full border border-emerald-400/80 bg-emerald-50/40 px-4 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:ring-offset-1"
        >
          {label}
        </button>
        <span className="text-[0.7rem] text-slate-500 truncate max-w-xs">
          {fileName}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
