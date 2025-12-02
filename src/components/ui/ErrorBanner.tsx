"use client";

import React from "react";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ title = "Something went wrong", message, onRetry }: Props) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-red-700">{message}</div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}
