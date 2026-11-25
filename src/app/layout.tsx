import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Literata } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";
import { AppShell } from "@/components/AppShell";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanctuary Bible — Read, Study & Reflect in Scripture",
  description:
    "A premium English Bible reading and study application with multiple translations, audio playback, personal notes, reading plans, and an AI Bible study assistant.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1b263b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${literata.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
