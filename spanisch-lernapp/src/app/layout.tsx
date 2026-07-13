import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Español Coach — wissenschaftlich fundiert",
  description: "Spanisch lernen mit Jarvis-Sprachmodus, Spaced Repetition und kritischer Bewertung.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          <Nav />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
