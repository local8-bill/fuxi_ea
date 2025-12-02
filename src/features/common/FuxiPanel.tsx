"use client";

import React from "react";

type Props = {
  title: string;
  status: string;
  children: React.ReactNode;
};

export function FuxiPanel({ title, status, children }: Props) {
  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{title}</div>
        <div className="text-xs" style={{ opacity: 0.6 }}>
          {status}
        </div>
      </div>
      {children}
    </div>
  );
}
