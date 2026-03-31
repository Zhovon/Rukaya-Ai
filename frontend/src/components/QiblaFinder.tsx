"use client";

import { useEffect, useState } from "react";

const MAKKAH = { lat: 21.4225, lon: 39.8262 };

function getQiblaFromBearing(bearing: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(bearing / 22.5) % 16];
}

export default function QiblaFinder() {
  const [bearing, setBearing] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
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
          setError("Could not calculate Qibla. Is the backend running?");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied. Please allow location access to find Qibla.");
        setLoading(false);
      }
    );

    // Listen for device compass if available
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
        ?? (e.alpha != null ? 360 - e.alpha : 0);
      setCompassHeading(heading);
    };

    window.addEventListener("deviceorientationabsolute" as keyof WindowEventMap, handleOrientation as EventListener);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientationabsolute" as keyof WindowEventMap, handleOrientation as EventListener);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  const needleAngle = bearing != null ? bearing - compassHeading : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-emerald-400">Qibla Finder</h2>
        <p className="text-sm text-slate-400 mt-1">Calculated using Great Circle formula</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Getting your location...</p>
        </div>
      )}

      {error && (
        <div className="w-full p-4 bg-red-900/20 border border-red-700/30 rounded-2xl text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {bearing != null && (
        <>
          {/* Compass */}
          <div className="relative w-64 h-64">
            {/* Compass ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-700 bg-slate-800/80 shadow-2xl flex items-center justify-center">
              {/* Cardinal directions */}
              {[{l:"N",r:0},{l:"E",r:90},{l:"S",r:180},{l:"W",r:270}].map(({l,r}) => (
                <span
                  key={l}
                  className="absolute text-xs font-bold text-slate-400"
                  style={{
                    transform: `rotate(${r}deg) translateY(-112px) rotate(-${r}deg)`,
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
                <div className="w-1.5 h-28 bg-gradient-to-t from-transparent via-emerald-500 to-emerald-400 rounded-full absolute top-4 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                {/* Kaaba icon at top of needle */}
                <div className="absolute top-2 text-lg">🕋</div>
              </div>

              {/* Center dot */}
              <div className="w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-500 z-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Qibla Direction</p>
              <p className="text-2xl font-bold text-emerald-400">{Math.round(bearing)}°</p>
              <p className="text-sm text-slate-400">{getQiblaFromBearing(bearing)}</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Distance to Makkah</p>
              <p className="text-2xl font-bold text-emerald-400">{distance?.toLocaleString()}</p>
              <p className="text-sm text-slate-400">km</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center max-w-xs">
            The needle points toward the Kaaba in Makkah Al-Mukarramah.
            On mobile devices, the compass automatically adjusts to your phone orientation.
          </p>
        </>
      )}
    </div>
  );
}
