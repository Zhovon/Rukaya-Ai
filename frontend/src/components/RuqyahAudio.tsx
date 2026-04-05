"use client";

import { useEffect, useRef, useState } from "react";

type TranslationStr = { en: string; bn: string };

type RuqyahTrack = {
  id: string;
  name: TranslationStr;
  arabic: string;
  count: string;
  description: TranslationStr;
  urls: string[]; // List of specific verse mp3s
};

const pad = (n: number) => n.toString().padStart(3, "0");

const generateVerseAudio = (surah: number, start: number, end: number) => {
  const urls = [];
  for (let i = start; i <= end; i++) {
    urls.push(`https://everyayah.com/data/Alafasy_128kbps/${pad(surah)}${pad(i)}.mp3`);
  }
  return urls;
};

const RUQYAH_TRACKS: RuqyahTrack[] = [
  {
    id: "fatiha",
    name: { en: "Surah Al-Fatiha", bn: "সূরা আল-ফাতিহা" },
    arabic: "سُورَةُ الْفَاتِحَة",
    count: "3x",
    description: { en: "The Opening — foundation of all Ruqyah", bn: "কুরআনের শুরু — রুকিয়াহের মূল ভিত্তি" },
    urls: generateVerseAudio(1, 1, 7),
  },
  {
    id: "baqarah-opening",
    name: { en: "Al-Baqarah 1–5", bn: "সূরা বাকারাহ ১-৫" },
    arabic: "البقرة ١-٥",
    count: "1x",
    description: { en: "Opening verses of Al-Baqarah — protection from Shaytan", bn: "সূরা বাকারাহর শুরুর আয়াত — শয়তান থেকে সুরক্ষা" },
    urls: generateVerseAudio(2, 1, 5),
  },
  {
    id: "ayatul-kursi",
    name: { en: "Ayatul Kursi", bn: "আয়াতুল কুরসী" },
    arabic: "آيَةُ الْكُرْسِي — البقرة ٢:٢٥٥",
    count: "3x",
    description: { en: "Greatest verse in the Quran — strongest protection", bn: "কুরআনের সর্বশ্রেষ্ঠ আয়াত — সবচেয়ে শক্তিশালী সুরক্ষা" },
    urls: generateVerseAudio(2, 255, 255),
  },
  {
    id: "ikhlas",
    name: { en: "Surah Al-Ikhlas", bn: "সূরা আল-ইখলাস" },
    arabic: "سُورَةُ الإِخْلَاص",
    count: "3x",
    description: { en: "Pure monotheism — equals one-third of the Quran", bn: "বিশুদ্ধ একত্ববাদ — কুরআনের এক-তৃতীয়াংশের সমান" },
    urls: generateVerseAudio(112, 1, 4),
  },
  {
    id: "falaq",
    name: { en: "Surah Al-Falaq", bn: "সূরা আল-ফালাক" },
    arabic: "سُورَةُ الْفَلَق",
    count: "3x",
    description: { en: "Seek refuge from external evil — envy and magic", bn: "বহিঃস্থ ক্ষতি থেকে আশ্রয় — হিংসা এবং জাদু" },
    urls: generateVerseAudio(113, 1, 5),
  },
  {
    id: "nas",
    name: { en: "Surah An-Nas", bn: "সূরা আন-নাস" },
    arabic: "سُورَةُ النَّاس",
    count: "3x",
    description: { en: "Seek refuge from whispering of Shaytan", bn: "শয়তানের প্ররোচনা থেকে আশ্রয়" },
    urls: generateVerseAudio(114, 1, 6),
  },
];

export default function RuqyahAudio({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number>(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingId(null);
    setPlayingIndex(0);
  };

  const playVerse = (track: RuqyahTrack, vIndex: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(track.urls[vIndex]);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setProgress((p) => ({ ...p, [track.id]: (audio.currentTime / audio.duration) * 100 || 0 }));
    };

    audio.onended = () => {
      if (vIndex < track.urls.length - 1) {
        setPlayingIndex(vIndex + 1);
        playVerse(track, vIndex + 1);
      } else {
        stopAudio();
      }
    };

    audio.play().catch(() => stopAudio());
  };

  const toggle = (track: RuqyahTrack) => {
    if (playingId === track.id) {
      stopAudio();
    } else {
      stopAudio();
      setPlayingId(track.id);
      setPlayingIndex(0);
      playVerse(track, 0);
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          {lang === "bn" ? "রুকিয়াহ অডিও লাইব্রেরি" : "Ruqyah Audio Library"}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {lang === "bn" 
            ? "মিশারি রাশিদ আল-আফাসির খাঁটি তিলাওয়াত। সম্পূর্ণ রুকিয়ার জন্য ক্রমানুসারে প্লে করুন।" 
            : "Authentic recitations by Mishary Rashid Al-Afasy. Play in order for a complete Ruqyah session."}
        </p>
        <div className="mt-2 p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/30 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          ⚠️ {lang === "bn" 
              ? "রুকিয়াহ সুন্নাহ ভিত্তিক একটি আধ্যাত্মিক আমল। এটি চিকিৎসার বিকল্প নয়। একজন ডাক্তার এবং যোগ্য আলেমের পরামর্শ নিন।" 
              : "Ruqyah is a spiritual practice from the Sunnah. It is not a substitute for medical treatment. Consult both a doctor and a qualified scholar."}
        </div>
      </div>

      <div className="space-y-3">
        {RUQYAH_TRACKS.map((track, i) => {
          const isPlaying = playingId === track.id;
          // Calculate overall progress across verses
          const currentVerseProgress = progress[track.id] || 0;
          const totalProgress = isPlaying 
            ? ((playingIndex + (currentVerseProgress / 100)) / track.urls.length) * 100 
            : 0;

          return (
            <div
              key={track.id}
              className={`rounded-2xl border p-4 transition-all duration-300 ${
                isPlaying
                  ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-600/50 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700/40 dark:hover:border-slate-600/60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isPlaying ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-[15px] ${isPlaying ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-100'}`}>
                      {track.name[lang]}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/30">
                      {lang === "bn" ? `পাঠ করুন ${track.count}` : `Recite ${track.count}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{track.description[lang]}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-500 mt-1 font-arabic" dir="rtl">{track.arabic}</p>

                  {isPlaying && (
                    <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${totalProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggle(track)}
                  className={`flex-none w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isPlaying
                      ? "bg-emerald-600 text-white shadow-md dark:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
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

      <div className="mt-6 p-4 bg-slate-50 border-slate-200 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-700/30 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          {lang === "bn" ? "📚 এই রুকিয়াহ সেশনের উৎস" : "📚 Sources for this Ruqyah session"}
        </p>
        <p>• {lang === "bn" ? "যাদুল মাআদ — ইবনুল কায়্যিম (সম্পূর্ণ রুকিয়াহ পদ্ধতি)" : "Zad al-Ma'ad — Ibn al-Qayyim (complete Ruqyah methodology)"}</p>
        <p>• {lang === "bn" ? "সহীহ বুখারী ৫৭৩৫ — নবী ﷺ মুআউয়িজাতাইন দিয়ে রুকিয়াহ করেছেন" : "Sahih al-Bukhari #5735 — The Prophet ﷺ performed Ruqyah with Al-Mu'awwidhatayn"}</p>
        <p>• {lang === "bn" ? "সহীহ মুসলিম ২১৯২ — আল-ফাতিহা দিয়ে রুকিয়াহ" : "Sahih Muslim #2192 — Ruqyah with Al-Fatiha"}</p>
        <p>• {lang === "bn" ? "তিলাওয়াত: মিশারি রাশিদ আল-আফাসি (everyayah.com)" : "Recitations: Mishary Rashid Al-Afasy (everyayah.com)"}</p>
      </div>
    </div>
  );
}
