"use client";

import React from "react";

export type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
};

export function AppHeader({ title = "Fuxi", subtitle, rightSlot }: AppHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: 12,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        position: "sticky",
        top: 0,
        background: "white",
        zIndex: 10,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{title}</div>
        {subtitle && <div style={{ color: "#666", fontSize: 12 }}>{subtitle}</div>}
      </div>
      {rightSlot}
    </header>
  );
}

export default AppHeader;