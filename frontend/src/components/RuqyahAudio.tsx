"use client";

import { useEffect, useRef, useState } from "react";

const RUQYAH_TRACKS = [
  {
    id: "fatiha",
    name: "Surah Al-Fatiha",
    arabic: "سُورَةُ الْفَاتِحَة",
    count: "3x",
    description: "The Opening — foundation of all Ruqyah",
    url: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3",
  },
  {
    id: "baqarah-opening",
    name: "Al-Baqarah 1–5",
    arabic: "البقرة ١-٥",
    count: "1x",
    description: "Opening verses of Al-Baqarah — protection from Shaytan",
    url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3",
  },
  {
    id: "ayatul-kursi",
    name: "Ayatul Kursi",
    arabic: "آيَةُ الْكُرْسِي — البقرة ٢:٢٥٥",
    count: "3x",
    description: "Greatest verse in the Quran — strongest protection",
    url: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/002.mp3",
  },
  {
    id: "ikhlas",
    name: "Surah Al-Ikhlas",
    arabic: "سُورَةُ الإِخْلَاص",
    count: "3x",
    description: "Pure monotheism — equals one-third of the Quran",
    url: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/112.mp3",
  },
  {
    id: "falaq",
    name: "Surah Al-Falaq",
    arabic: "سُورَةُ الْفَلَق",
    count: "3x",
    description: "Seek refuge from external evil — envy and magic",
    url: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/113.mp3",
  },
  {
    id: "nas",
    name: "Surah An-Nas",
    arabic: "سُورَةُ النَّاس",
    count: "3x",
    description: "Seek refuge from whispering of Shaytan",
    url: "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/114.mp3",
  },
];

export default function RuqyahAudio() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const toggle = (id: string, url: string) => {
    if (playing === id) {
      audioRefs.current[id]?.pause();
      setPlaying(null);
    } else {
      // Pause any currently playing
      if (playing && audioRefs.current[playing]) {
        audioRefs.current[playing].pause();
      }
      if (!audioRefs.current[id]) {
        const audio = new Audio(url);
        audio.ontimeupdate = () => {
          setProgress((p) => ({ ...p, [id]: (audio.currentTime / audio.duration) * 100 || 0 }));
        };
        audio.onended = () => setPlaying(null);
        audioRefs.current[id] = audio;
      }
      audioRefs.current[id].play();
      setPlaying(id);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((a) => a.pause());
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-emerald-400">Ruqyah Audio Library</h2>
        <p className="text-sm text-slate-400 mt-1">
          Authentic recitations by Mishary Rashid Al-Afasy. Play in order for a complete Ruqyah session.
        </p>
        <div className="mt-2 p-3 bg-amber-900/20 border border-amber-700/30 rounded-xl text-xs text-amber-300">
          ⚠️ Ruqyah is a spiritual practice from the Sunnah. It is not a substitute for medical treatment.
          Consult both a doctor and a qualified scholar.
        </div>
      </div>

      <div className="space-y-3">
        {RUQYAH_TRACKS.map((track, i) => {
          const isPlaying = playing === track.id;
          const prog = progress[track.id] || 0;
          return (
            <div
              key={track.id}
              className={`rounded-2xl border p-4 transition-all duration-300 ${
                isPlaying
                  ? "bg-emerald-950/50 border-emerald-600/50"
                  : "bg-slate-800/60 border-slate-700/40 hover:border-slate-600/60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-100 text-[15px]">{track.name}</span>
                    <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-700/30">
                      Recite {track.count}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{track.description}</p>
                  <p className="text-sm text-slate-500 mt-1 font-arabic" dir="rtl">{track.arabic}</p>

                  {isPlaying && (
                    <div className="mt-2 w-full bg-slate-700 rounded-full h-1">
                      <div
                        className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggle(track.id, track.url)}
                  className={`flex-none w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isPlaying
                      ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">📚 Sources for this Ruqyah session</p>
        <p>• Zad al-Ma&apos;ad — Ibn al-Qayyim (complete Ruqyah methodology)</p>
        <p>• Sahih al-Bukhari #5735 — The Prophet ﷺ performed Ruqyah with Al-Mu&apos;awwidhatayn</p>
        <p>• Sahih Muslim #2192 — Ruqyah with Al-Fatiha</p>
        <p>• Recitations: Mishary Rashid Al-Afasy (quranicaudio.com)</p>
      </div>
    </div>
  );
}
