import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#080c16",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Rukaya AI — Islamic Scholarly Companion",
  description:
    "Rukaya AI is an authentic Islamic companion powered by Quran, Hadith, and classical Fiqh. Get guidance on Ruqyah, prayer times, Zakat, Qibla, and more — grounded in the Quran and Sunnah.",
  keywords: [
    "Islamic AI", "Ruqyah", "Hadith", "Fiqh", "Prayer times",
    "Zakat calculator", "Qibla", "Islamic companion", "Quran",
  ],
  authors: [{ name: "Rukaya AI" }],
  openGraph: {
    title: "Rukaya AI — Islamic Scholarly Companion",
    description: "Authentic Islamic guidance powered by Quran, Hadith & classical Fiqh.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rukaya AI — Islamic Scholarly Companion",
    description: "Authentic Islamic guidance powered by Quran, Hadith & classical Fiqh.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
