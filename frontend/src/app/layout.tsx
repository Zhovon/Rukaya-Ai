import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#080c16",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://rukaya.zhovon.com'),
  title: "Rukaya AI | Authentic Islamic Companion, Quran, Hadith & Zakat",
  description:
    "Rukaya AI is your trusted Islamic assistant. AI-powered Hadith verification, Zakat calculation, Qibla compass, Ruqyah audio, and scholarly Fiqh guidance.",
  keywords: [
    "AI Islamic Assistant", "Authentic Hadith Verifier", "Online Zakat Calculator", "Accurate Qibla Compass online", 
    "Ruqyah Audio Mishary", "Quran AI", "Islamic Fiqh questions"
  ],
  authors: [{ name: "Zhovon" }],
  openGraph: {
    title: "Rukaya AI | Authentic Islamic Companion",
    description: "AI-powered Hadith verification, Zakat calculation, Qibla compass, and scholarly guidance.",
    url: "https://rukaya.zhovon.com",
    siteName: "Rukaya AI",
    images: [{ url: "/icon.svg", width: 800, height: 600, alt: "Rukaya AI Logo" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rukaya AI | Authentic Islamic Companion",
    description: "AI-powered Hadith verification, Zakat calculation, and scholarly guidance.",
    images: ["/icon.svg"],
  },
  robots: { index: true, follow: true },
  alternates: {
    languages: {
      'en-US': '/?lang=en',
      'bn-BD': '/?lang=bn',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Rukaya AI",
    "url": "https://rukaya.zhovon.com",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "All",
    "description": "Authentic Islamic companion featuring an AI Hadith Verifier, Zakat Calculator, Qibla Compass, and Ruqyah Audio.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
