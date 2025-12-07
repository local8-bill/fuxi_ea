"use client";

import React from "react";
import { FileUpload } from "@/components/shared/FileUpload";

interface Props {
  title: string;
  helper: string;
  label: string;
  onFileSelected: (file: File) => Promise<void> | void;
  accept?: string;
  className?: string;
}

export function FileUploadPanel({
  title,
  helper,
  label,
  onFileSelected,
  accept,
  className = "",
}: Props) {
  return (
    <div
      className={`p-6 rounded-2xl border border-slate-200 bg-white ${className}`}
    >
      <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
        {title}
      </p>

      <p className="text-xs text-gray-600 mb-4">{helper}</p>

      {/* ✔️ ONLY custom uploader — NO browser-native file input */}
      <FileUpload label={label} accept={accept} onFileSelected={onFileSelected} />
    </div>
  );
}
