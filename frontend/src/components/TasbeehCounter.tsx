"use client";

import { useState, useEffect } from "react";

type DhikrStage = "subhanallah" | "alhamdulillah" | "allahuakbar" | "done";

const t = {
  en: {
    title: "Post-Salah Tasbeeh",
    subtitle: "Authentic Sunnah Dhikr completed seamlessly.",
    subhanallah: "Subhanallah (Glory be to Allah)",
    alhamdulillah: "Alhamdulillah (All praise is due to Allah)",
    allahuakbar: "Allahu Akbar (Allah is the Greatest)",
    done: "Dhikr Complete! May Allah accept it.",
    reset: "Reset Counter",
    tapToCount: "Tap Anywhere to Count",
    todayTracker: "Today's Fard Dhikr Log:",
  },
  bn: {
    title: "সালাত পরবর্তী তাসবীহ",
    subtitle: "সহজ এবং নির্বিঘ্ন সুন্নাহ জিকির।",
    subhanallah: "সুবহানাল্লাহ (আল্লাহ পবিত্র)",
    alhamdulillah: "আলহামদুলিল্লাহ (সকল প্রশংসা আল্লাহর)",
    allahuakbar: "আল্লাহু আকবার (আল্লাহ সর্বশ্রেষ্ঠ)",
    done: "জিকির সম্পূর্ণ! আল্লাহ কবুল করুন।",
    reset: "রিসেট করুন",
    tapToCount: "গণনার জন্য যে কোনো স্থানে ট্যাপ করুন",
    todayTracker: "আজকের ফরজ নামাজ পরবর্তী জিকির ট্র্যাকার:",
  }
};

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function TasbeehCounter({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [count, setCount] = useState(0);
  const [stage, setStage] = useState<DhikrStage>("subhanallah");
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([]);
  const [activePrayer, setActivePrayer] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const dict = t[lang];

  useEffect(() => {
    try {
      const savedDate = localStorage.getItem("rukaya_dhikr_date");
      const today = new Date().toISOString().split("T")[0];
      if (savedDate !== today) {
        localStorage.setItem("rukaya_dhikr_date", today);
        localStorage.setItem("rukaya_dhikr_completed", JSON.stringify([]));
      } else {
        const p = localStorage.getItem("rukaya_dhikr_completed");
        if (p) setCompletedPrayers(JSON.parse(p));
      }
    } catch {}
  }, []);

  const handleTap = () => {
    if (stage === "done") return;
    
    // Haptic feedback if supported natively
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
    
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 150);

    const newCount = count + 1;
    
    if (stage === "subhanallah") {
      if (newCount === 33) { setStage("alhamdulillah"); setCount(0); window.navigator?.vibrate?.([50, 50, 50]); }
      else setCount(newCount);
    } else if (stage === "alhamdulillah") {
      if (newCount === 33) { setStage("allahuakbar"); setCount(0); window.navigator?.vibrate?.([50, 50, 50]); }
      else setCount(newCount);
    } else if (stage === "allahuakbar") {
      if (newCount === 34) {
        setStage("done");
        setCount(0);
        window.navigator?.vibrate?.([100, 100, 100, 100]);
        if (activePrayer && !completedPrayers.includes(activePrayer)) {
          const updated = [...completedPrayers, activePrayer];
          setCompletedPrayers(updated);
          localStorage.setItem("rukaya_dhikr_completed", JSON.stringify(updated));
        }
      } else {
        setCount(newCount);
      }
    }
  };

  const getDhikrText = () => {
    if (stage === "subhanallah") return dict.subhanallah;
    if (stage === "alhamdulillah") return dict.alhamdulillah;
    if (stage === "allahuakbar") return dict.allahuakbar;
    return dict.done;
  };

  const targetCount = stage === "allahuakbar" ? 34 : 33;
  const progressPercent = stage === "done" ? 100 : (count / targetCount) * 100;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dict.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{dict.subtitle}</p>
      </div>

      {/* Fard Prayer Selection */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest text-center">{dict.todayTracker}</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {PRAYERS.map(p => {
            const isDone = completedPrayers.includes(p);
            const isActive = activePrayer === p;
            return (
              <button
                key={p}
                onClick={() => { setActivePrayer(p); if(stage==="done") { setStage("subhanallah"); setCount(0); } }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                  isDone 
                    ? "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50" 
                    : isActive 
                      ? "bg-emerald-500 text-white shadow-md border-emerald-600 dark:bg-emerald-600" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {p} {isDone && "✔️"}
              </button>
            )
          })}
        </div>
      </div>

      {/* Massive Tap Zone */}
      <div 
        onClick={handleTap}
        className={`flex-1 relative bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all duration-75 select-none touch-manipulation ${
          isPressing ? "scale-[0.98] bg-slate-100 dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 shadow-inner" : ""
        } ${stage !== "done" ? "active:bg-slate-200 dark:active:bg-slate-800" : ""}`}
      >
        
        {/* Visual Progress Background Map */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-emerald-500/10 dark:bg-emerald-500/20 transition-all duration-300 ease-out"
          style={{ height: `${progressPercent}%` }}
        />

        {stage !== "done" ? (
          <div className="z-10 flex flex-col items-center gap-4">
             <div className="text-[120px] font-black text-emerald-600 dark:text-emerald-400 leading-none tabular-nums drop-shadow-sm">
               {count}
             </div>
             <div className="px-6 py-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-full border border-emerald-100 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100 font-bold text-center text-sm">
               {getDhikrText()} <span className="text-emerald-500 opacity-60 ml-1">/ {targetCount}</span>
             </div>
             <p className="mt-8 text-xs text-slate-400 animate-pulse font-medium tracking-widest uppercase">{dict.tapToCount}</p>
          </div>
        ) : (
          <div className="z-10 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{getDhikrText()}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setStage("subhanallah"); setCount(0); setActivePrayer(null); }}
              className="mt-4 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all"
            >
              {dict.reset}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
