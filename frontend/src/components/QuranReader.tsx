"use client";

import { useState, useEffect, useRef } from "react";

type Verse = {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translation: string;
  audio_url: string;
};

type Surah = {
  id: number;
  name_simple: string;
  name_arabic: string;
  translated_name: {
    name: string;
  };
};

export default function QuranReader({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch Surah List
  useEffect(() => {
    fetch(`https://api.quran.com/api/v4/chapters?language=${lang}`)
      .then(res => res.json())
      .then(data => setSurahs(data.chapters))
      .catch(console.error);
  }, [lang]);

  // 2. Fetch Verses for Selected Surah
  useEffect(() => {
    setIsLoading(true);
    // Translation: 20 = Saheeh International (en), 161 = Taisirul Quran (bn)
    const translationId = lang === "bn" ? 161 : 20;
    
    // First fetch texts
    fetch(`https://api.quran.com/api/v4/verses/by_chapter/${selectedSurah}?language=${lang}&words=false&translations=${translationId}&fields=text_uthmani&per_page=300`)
      .then(res => res.json())
      .then(async (data) => {
        const versesData = data.verses || [];
        // Fetch audio for these verses (Mishary Alafasy = 7)
        const audioRes = await fetch(`https://api.quran.com/api/v4/recitations/7/by_chapter/${selectedSurah}?per_page=300`);
        const audioData = await audioRes.json();
        const audios = audioData.audio_files || [];
        
        const merged = versesData.map((v: any, index: number) => ({
          id: v.id,
          verse_key: v.verse_key,
          text_uthmani: v.text_uthmani,
          translation: v.translations?.[0]?.text?.replace(/<[^>]+>/g, '') || "Translation loading...",
          audio_url: audios[index]?.url ? `https://verses.quran.com/${audios[index].url}` : null,
        }));
        
        setVerses(merged);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsLoading(false);
      });
  }, [selectedSurah, lang]);

  const toggleAudio = (verse: Verse) => {
    if (!verse.audio_url) return;
    
    if (playingId === verse.verse_key) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      audioRef.current?.pause();
      const audio = new Audio(verse.audio_url);
      audioRef.current = audio;
      audio.onended = () => {
        // Auto play next
        const currentIndex = verses.findIndex(v => v.verse_key === verse.verse_key);
        if (currentIndex !== -1 && currentIndex < verses.length - 1) {
          const nextVerse = verses[currentIndex + 1];
          toggleAudio(nextVerse);
        } else {
          setPlayingId(null);
        }
      };
      audio.play().catch(console.error);
      setPlayingId(verse.verse_key);
    }
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header & Surah Selector */}
      <div className="bg-white dark:bg-slate-800/60 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/40 shadow-sm">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
          📖 {lang === "bn" ? "কুরআন মাজীদ" : "The Noble Quran"}
        </h2>
        <div className="flex items-center gap-3 w-full">
          <select
            value={selectedSurah}
            onChange={(e) => setSelectedSurah(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-3 focus:outline-none focus:border-emerald-500 font-medium text-sm sm:text-base break-words whitespace-normal"
          >
            {surahs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}. {s.name_simple} ({s.translated_name.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Verses Container */}
      <div className="space-y-4 pb-20">
        {selectedSurah !== 1 && selectedSurah !== 9 && !isLoading && (
          <div className="text-center py-6 text-2xl font-arabic text-emerald-800 dark:text-emerald-300">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْم
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">{lang === "bn" ? "আয়াত লোড হচ্ছে..." : "Loading verses..."}</p>
          </div>
        ) : (
          verses.map((verse) => {
            const isPlaying = playingId === verse.verse_key;
            return (
              <div
                key={verse.id}
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  isPlaying
                    ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-600/50"
                    : "bg-white border-slate-200 hover:border-emerald-100 dark:bg-slate-800/40 dark:border-slate-700/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                    <span className="flex-none bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                      {verse.verse_key}
                    </span>
                    <button
                      onClick={() => toggleAudio(verse)}
                      disabled={!verse.audio_url}
                      className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        !verse.audio_url 
                          ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400" 
                          : isPlaying
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                            : "bg-slate-100 text-emerald-600 hover:bg-emerald-100 dark:bg-slate-700 dark:text-emerald-400"
                      }`}
                    >
                      {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-1 w-full flex justify-end">
                    <p className={`text-2xl sm:text-3xl font-arabic leading-loose text-right ${isPlaying ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'}`} dir="rtl">
                      {verse.text_uthmani}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <p className={`text-[15px] leading-relaxed ${isPlaying ? 'text-slate-800 dark:text-slate-300 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                    {verse.translation}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
