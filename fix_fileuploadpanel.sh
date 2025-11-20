#!/bin/zsh
set -e

TARGET="src/components/panels/FileUploadPanel.tsx"
BACKUP="src/components/panels/FileUploadPanel.tsx.bak_$(date +%Y%m%d%H%M%S)"

echo "📦 Backing up existing FileUploadPanel.tsx to:"
echo "   $BACKUP"
cp "$TARGET" "$BACKUP"

echo "✍️  Writing cleaned FileUploadPanel.tsx…"

cat << 'EOF' > "$TARGET"
"use client";

import React from "react";
import { FileUpload } from "@/components/shared/FileUpload";

interface Props {
  title: string;
  helper: string;
  label: string;
  onFileSelected: (file: File) => Promise<void> | void;
  className?: string;
}

export function FileUploadPanel({
  title,
  helper,
  label,
  onFileSelected,
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
      <FileUpload label={label} onFileSelected={onFileSelected} />
    </div>
  );
}
EOF

echo "✅ Done!"
echo "🔄 Restart your dev server (npm run dev)"
echo "🔁 Hard-refresh your browser (Shift + Reload)"
echo "🧹 Sanity check: There should be ZERO 'Choose File' buttons remaining."
