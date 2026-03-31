import type { Metadata } from "next";
import "./globals.css";

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
  themeColor: "#080c16",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
