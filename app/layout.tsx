import "./globals.css";
export const metadata = {
  title: "Cortexa Affect AI — Emotion Analyzer for Ads",
  description: "Analyze emotional impact of your ad copy in seconds.",
  icons: { icon: "/favicon.ico" }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
