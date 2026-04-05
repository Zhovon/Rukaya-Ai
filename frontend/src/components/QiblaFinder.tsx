"use client";

import { useEffect, useState } from "react";

const MAKKAH = { lat: 21.4225, lon: 39.8262 };

const t = {
  en: {
    title: "Qibla Finder",
    subtitle: "Calculated using Great Circle formula",
    loadingLocation: "Getting your location...",
    noGeo: "Geolocation not supported by your browser.",
    backendError: "Could not calculate Qibla. Check connection.",
    denied: "Location permission denied. Please allow location access to find Qibla.",
    direction: "Qibla Direction",
    distance: "Distance to Makkah",
    km: "km",
    note: "The needle points toward the Kaaba in Makkah Al-Mukarramah. On mobile devices, the compass automatically adjusts to your phone orientation."
  },
  bn: {
    title: "কিবলা ফাইন্ডার",
    subtitle: "গ্রেট সার্কেল ফর্মুলা ব্যবহার করে গণনা করা হয়েছে",
    loadingLocation: "আপনার অবস্থান নির্ণয় করা হচ্ছে...",
    noGeo: "আপনার ব্রাউজার জিওলোকেশন সমর্থন করে না।",
    backendError: "কিবলা নির্ধারণ করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।",
    denied: "অবস্থান অনুমতি প্রত্যাখ্যান করা হয়েছে। কিবলা খুঁজতে লোকেশন এক্সেস চালু করুন।",
    direction: "কিবলার দিক",
    distance: "মক্কা থেকে দূরত্ব",
    km: "কি.মি.",
    note: "কাঁটাটি মক্কা আল-মুকাররামার কাবার দিকে নির্দেশ করছে। মোবাইল ডিভাইসে, কম্পাস স্বয়ংক্রিয়ভাবে আপনার ফোনের ওরিয়েন্টেশনের সাথে মিলে যায়।"
  }
};

function getQiblaFromBearing(bearing: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(bearing / 22.5) % 16];
}

export default function QiblaFinder({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [bearing, setBearing] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const dict = t[lang];

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(dict.noGeo);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/qibla?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          setBearing(data.bearing);
          setDistance(data.distance_km);
        } catch {
          setError(dict.backendError);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError(dict.denied);
        setLoading(false);
      }
    );

    // Listen for device compass if available
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading
        ?? (e.alpha != null ? 360 - e.alpha : 0);
      setCompassHeading(heading);
    };

    window.addEventListener("deviceorientationabsolute" as keyof WindowEventMap, handleOrientation as EventListener);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientationabsolute" as keyof WindowEventMap, handleOrientation as EventListener);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [dict]);

  const needleAngle = bearing != null ? bearing - compassHeading : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{dict.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{dict.subtitle}</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">{dict.loadingLocation}</p>
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-2xl text-red-700 dark:text-red-300 text-sm text-center font-medium shadow-sm">
          {error}
        </div>
      )}

      {bearing != null && (
        <>
          {/* Compass */}
          <div className="relative w-64 h-64 mt-4 mb-4">
            {/* Compass ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-2xl flex items-center justify-center">
              {/* Cardinal directions */}
              {[{l:"N",r:0},{l:"E",r:90},{l:"S",r:180},{l:"W",r:270}].map(({l,r}) => (
                <span
                  key={l}
                  className="absolute text-sm font-bold text-slate-400 dark:text-slate-500"
                  style={{
                    transform: `rotate(${r}deg) translateY(-110px) rotate(-${r}deg)`,
                  }}
                >
                  {l}
                </span>
              ))}

              {/* Kaaba needle */}
              <div
                className="absolute w-full h-full flex items-center justify-center transition-transform duration-500"
                style={{ transform: `rotate(${needleAngle}deg)` }}
              >
                <div className="w-1.5 h-28 bg-gradient-to-t from-transparent via-emerald-500 to-emerald-400 rounded-full absolute top-4 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                {/* Kaaba icon at top of needle */}
                <div className="absolute top-0 text-2xl drop-shadow-md">🕋</div>
              </div>

              {/* Center dot */}
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 border-[3px] border-emerald-500 dark:border-slate-500 z-10 shadow-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{dict.direction}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(bearing)}°</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{getQiblaFromBearing(bearing)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{dict.distance}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{distance?.toLocaleString()}</p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.km}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs mt-2 leading-relaxed">
            {dict.note}
          </p>
        </>
      )}
    </div>
  );
}
