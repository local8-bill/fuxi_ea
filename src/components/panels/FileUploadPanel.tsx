"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { FileUpload } from "@/components/shared/FileUpload";

interface FileUploadPanelProps {
  title: string;
  helper: string;
  label: string;
  onFileSelected: (file: File) => Promise<void> | void;
  className?: string;
  children?: ReactNode;
}

export function FileUploadPanel({
  title,
  helper,
  label,
  onFileSelected,
  className,
  children,
}: FileUploadPanelProps) {
  return (
    <Card className={`mb-8 ${className ?? ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
            {title}
          </p>
          <p className="text-xs text-gray-500 max-w-md">{helper}</p>
        </div>
        <FileUpload label={label} onFileSelected={onFileSelected} />
      </div>
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
