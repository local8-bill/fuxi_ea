export const metadata = { title: "Fuxi EA", description: "Capability Scoring" };
import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="border-b">
          <div className="container py-3 flex gap-3 items-center">
            <a href="/" className="font-semibold">Fuxi • Capability Scoring</a>
            <a href="/new" className="btn btn-ghost">New Project</a>
          </div>
        </div>
        <div className="container py-4">{children}</div>
      </body>
    </html>
  );
}
