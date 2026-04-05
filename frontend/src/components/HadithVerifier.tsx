"use client";

import { useState } from "react";

type VerificationResult = {
  verdict: "authentic" | "weak" | "fabricated" | "controversial" | "unknown";
  sources: string[];
  reasoning_en: string;
  reasoning_bn: string;
  arabic_text?: string;
  english_text?: string;
  bengali_text?: string;
};

const t = {
  en: {
    title: "Hadith Verifier",
    subtitle: "AI-powered scholarly cross-referencing for Hadith authentication.",
    warning: "This tool cross-references classical databases using AI. It is NOT a substitute for a living scholar (Aalim).",
    placeholder: "Paste a Hadith snippet here (e.g., 'Seek knowledge even in China')...",
    btnVerify: "Verify Authenticity",
    btnLoading: "Analyzing texts...",
    errEmpty: "Please enter a Hadith to verify.",
    errServer: "Failed to verify. Please try again later.",
    verdicts: {
      authentic: "✅ AUTHENTIC (Sahih/Hasan)",
      weak: "⚠️ WEAK (Da'if)",
      fabricated: "🚨 FABRICATED (Mawdu')",
      controversial: "⚖️ DIFFERENCE OF OPINION (Ikhtilaf)",
      unknown: "❓ UNKNOWN BASES"
    },
    sourcesLabel: "Classical Sources",
    reasoningLabel: "Scholarly Reasoning"
  },
  bn: {
    title: "হাদিস যাচাইকারী",
    subtitle: "হাদিস যাচাইয়ের জন্য এআই-চালিত স্কলারলি রেফারেন্সিং টুল।",
    warning: "এই টুলটি এআই ব্যবহার করে ক্লাসিক্যাল ডেটাবেস যাচাই করে। এটি কোনো জীবিত আলেম বা স্কলারের বিকল্প নয়।",
    placeholder: "এখানে একটি হাদিস বা বাক্য পেস্ট করুন...",
    btnVerify: "সত্যতা যাচাই করুন",
    btnLoading: "সনদ যাচাই করা হচ্ছে...",
    errEmpty: "যাচাই করার জন্য একটি হাদিস লিখুন।",
    errServer: "যাচাই করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
    verdicts: {
      authentic: "✅ সহীহ / হাসান (Authentic)",
      weak: "⚠️ যঈফ / দুর্বল (Weak)",
      fabricated: "🚨 বানোয়াট (Fabricated)",
      controversial: "⚖️ আলেমদের মতভেদ (Ikhtilaf)",
      unknown: "❓ ভিত্তি খুঁজে পাওয়া যায়নি"
    },
    sourcesLabel: "মূল সূত্র",
    reasoningLabel: "স্কলারলি বিশ্লেষণ ও সনদ"
  }
};

export default function HadithVerifier({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dict = t[lang];

  const handleVerify = async () => {
    if (!text.trim()) {
      setError(dict.errEmpty);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/verify-hadith", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang })
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(dict.errServer);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case "authentic": return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700";
      case "weak": return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700";
      case "fabricated": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
      case "controversial": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700";
      default: return "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Header Info */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dict.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{dict.subtitle}</p>
      </div>

      {/* Safety Warning */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <span className="text-lg">⚠️</span>
        <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
          {dict.warning}
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={dict.placeholder}
          className="w-full h-32 bg-transparent p-3 text-slate-800 dark:text-slate-200 resize-none focus:outline-none text-sm leading-relaxed"
          dir="auto"
        />
        <div className="flex justify-end p-2 border-t border-slate-100 dark:border-slate-800/50 mt-1">
          <button
            onClick={handleVerify}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {dict.btnLoading}</>
            ) : dict.btnVerify}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl animate-in flip-in-y duration-500">
          <div className="flex flex-col gap-5">
            
            <div className={`px-4 py-3 border rounded-xl font-bold tracking-wider text-sm text-center uppercase shadow-sm ${getVerdictStyles(result.verdict)}`}>
              {dict.verdicts[result.verdict] || dict.verdicts.unknown}
            </div>

            {/* Sources list */}
            {result.sources && result.sources.length > 0 && result.sources[0] !== "" && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>📚</span> {dict.sourcesLabel}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((src, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning block */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
               <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>⚖️</span> {dict.reasoningLabel}
               </h4>
               <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed max-w-prose">
                 {lang === "bn" ? result.reasoning_bn : result.reasoning_en}
               </p>
            </div>

            {/* Verified Text block */}
            {(result.arabic_text || result.english_text || result.bengali_text) && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative">
                <span className="absolute -top-3 left-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                  {lang === "bn" ? "যাচাইকৃত পাঠ্য" : "Verified Text"}
                </span>

                {result.arabic_text && (
                  <p className="text-xl font-arabic text-emerald-800 dark:text-emerald-300 leading-loose text-center mb-4 mt-2" dir="rtl">
                    {result.arabic_text}
                  </p>
                )}
                
                {((lang === "bn" && result.bengali_text) || (lang === "en" && result.english_text)) && (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-center italic">
                    "{lang === "bn" ? result.bengali_text : result.english_text}"
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
