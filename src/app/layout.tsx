import "./globals.css";

export const metadata = {
  title: "Fuxi • Capability Scoring",
  description: "Project start + scoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
