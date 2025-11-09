import "./globals.css";

export const metadata = {
  title: "Fuxi • Capability Scoring",
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    icon: [{ url: "/icon-192.png" }, { url: "/icon-512.png" }]
  },
  manifest: "/site.webmanifest",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
