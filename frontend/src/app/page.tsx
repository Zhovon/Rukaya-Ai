"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const RuqyahAudio     = dynamic<{ lang: Lang }>(() => import("@/components/RuqyahAudio"),     { ssr: false });
const QiblaFinder     = dynamic<{ lang: Lang }>(() => import("@/components/QiblaFinder"),     { ssr: false });
const ZakatCalculator = dynamic<{ lang: Lang }>(() => import("@/components/ZakatCalculator"), { ssr: false });
const QuranReader     = dynamic<{ lang: Lang }>(() => import("@/components/QuranReader"),     { ssr: false });
const HadithVerifier  = dynamic<{ lang: Lang }>(() => import("@/components/HadithVerifier"),  { ssr: false });
const TasbeehCounter  = dynamic<{ lang: Lang }>(() => import("@/components/TasbeehCounter"),  { ssr: false });
import PwaInstallButton from "@/components/PwaInstallButton";
import AuthModal from "@/components/AuthModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────
type Message    = { id: string; role: "user" | "assistant"; content: string; isAudioPlaying?: boolean };
type Session    = { id: string; title: string; messages: Message[]; createdAt: number };
type PrayerTimes = { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string; hijri_date: string };
type Tool       = "chat" | "quran" | "ruqyah" | "qibla" | "zakat" | "verifier" | "tasbeeh";
type Lang       = "en" | "bn";

const SESSIONS_KEY = "rukaya_sessions";
const LANG_KEY     = "rukaya_lang";
const MADHHABS     = ["Hanafi", "Maliki", "Shafi'i", "Hanbali"];

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getTitle(msgs: Message[]) {
  const first = msgs.find(m => m.role === "user");
  return first ? first.content.slice(0, 42) + (first.content.length > 42 ? "…" : "") : "New Chat";
}

// ─── Dictionary ──────────────────────────────────────────────
const t = {
  en: {
    app: "Rukaya AI",
    sub: "Islamic Companion",
    newChat: "New Chat",
    toolsMenu: "Tools",
    chatsMenu: "Chats",
    noChats: "No conversations yet",
    madhhab: "Madhhab",
    toolChat: "Chat",
    toolQuran: "Quran",
    toolRuqyah: "Ruqyah Audio",
    toolQibla: "Qibla Finder",
    toolZakat: "Zakat Calculator",
    welcomeTitle: "Rukaya AI",
    welcomeSub: "Your Islamic scholarly companion, grounded in authentic Quran & Sunnah",
    suggest1: "What is the complete Ruqyah for removing evil eye?",
    suggest2: "What are today's prayer times for my location?",
    suggest3: "Explain Ayatul Kursi (2:255) with full tafsir",
    suggest4: "What breaks Wudu according to the Hanafi school?",
    suggest5: "How do I calculate my Zakat this year?",
    suggest6: "What does the Prophet ﷺ say about patience (sabr)?",
    placeholder: "Ask about Quran, Hadith, Fiqh, prayer times…",
    disclaimer: "Rukaya AI can make mistakes. Always verify with qualified Islamic scholars.",
    seeking: "Seeking knowledge…",
    stop: "⏸ Stop",
    readAloud: "🔊 Read aloud",
    offline: "⚠️ Backend offline — please check connection",
    retry: "Retry"
  },
  bn: {
    app: "রুকাইয়াহ এআই",
    sub: "ইসলামী সঙ্গী",
    newChat: "নতুন চ্যাট",
    toolsMenu: "টুলসমূহ",
    chatsMenu: "চ্যাট লিস্ট",
    noChats: "এখনো কোনো কথোপকথন নেই",
    madhhab: "মাযহাব",
    toolChat: "চ্যাট",
    toolQuran: "কুরআন",
    toolRuqyah: "রুকিয়াহ অডিও",
    toolQibla: "কিবলা ফাইন্ডার",
    toolZakat: "যাকাত ক্যালকুলেটর",
    welcomeTitle: "রুকাইয়াহ এআই",
    welcomeSub: "আপনার নির্ভরযোগ্য ইসলামী স্কলারলি সঙ্গী, যা কুরআন ও সুন্নাহ ভিত্তিক",
    suggest1: "বদ নজর দূর করার সম্পূর্ণ রুকিয়াহ কি?",
    suggest2: "আমার বর্তমান অবস্থানের জন্য আজকের নামাজের সময়সূচী কি?",
    suggest3: "আয়াতুল কুরসীর সম্পূর্ণ তাফসীর করুন",
    suggest4: "হানাফি মাযহাব অনুযায়ী কি কি কারণে ওযু ভঙ্গ হয়?",
    suggest5: "আমি এই বছর আমার যাকাত কীভাবে হিসাব করব?",
    suggest6: "ধৈর্য (সবর) সম্পর্কে রাসূল ﷺ কি বলেছেন?",
    placeholder: "কুরআন, হাদিস, ফিকহ বা নামাজের সময় সম্পর্কে জিজ্ঞাসা করুন...",
    disclaimer: "রুকাইয়াহ এআই ভুল করতে পারে। সর্বদা যোগ্য ইসলামী স্কলারদের দ্বারা যাচাই করুন।",
    seeking: "জ্ঞান অন্বেষণ করা হচ্ছে…",
    stop: "⏸ থামুন",
    readAloud: "🔊 জোরে পড়ুন",
    offline: "⚠️ সার্ভার অফলাইন — আপনার কানেকশন চেক করুন",
    retry: "পুনরায় চেষ্টা করুন"
  }
};

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ sessions, activeSessionId, activeTool, madhhab, prayerTimes, lang, user, onLangChange, onNewChat,
  onSelectSession, onDeleteSession, onSelectTool, onMadhhabChange, onClose, onLoginClick, onLogoutClick, onProfileClick, isMobile }: {
  sessions: Session[]; activeSessionId: string | null; activeTool: Tool;
  madhhab: string; prayerTimes: PrayerTimes | null; lang: Lang; user: any; onLangChange: (l: Lang) => void;
  onNewChat: () => void; onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void; onSelectTool: (t: Tool) => void;
  onMadhhabChange: (m: string) => void; onClose: () => void; 
  onLoginClick: () => void; onLogoutClick: () => void; onProfileClick: () => void; isMobile: boolean;
}) {
  const dict = t[lang];
  const tools: { id: Tool; emoji: string; label: string }[] = [
    { id: "quran",  emoji: "📖", label: dict.toolQuran  },
    { id: "ruqyah", emoji: "🎧", label: dict.toolRuqyah },
    { id: "qibla",  emoji: "🧭", label: dict.toolQibla  },
    { id: "zakat",  emoji: "⚖️", label: dict.toolZakat  },
    { id: "verifier", emoji: "🔍", label: lang === "bn" ? "হাদিস যাচাই" : "Hadith Verifier" },
    { id: "tasbeeh", emoji: "📿", label: lang === "bn" ? "তাসবীহ" : "Tasbeeh" },
  ];
  const nav = (cb: () => void) => { cb(); if (isMobile) onClose(); };

  return (
    <aside className="flex flex-col h-full w-72 bg-white text-primary border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 islamic-pattern">
      {/* Brand & Lang Toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/20 font-arabic">
            ر
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm leading-none">{dict.app}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide">{dict.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button 
            onClick={() => onLangChange(lang === "en" ? "bn" : "en")}
            className="flex items-center justify-center h-7 px-2 text-xs font-medium rounded bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
          
          {isMobile && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button onClick={() => nav(onNewChat)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 text-sm font-semibold transition-all duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {dict.newChat}
        </button>
        <PwaInstallButton lang={lang} />
      </div>

      {/* Tools */}
      <div className="px-3 pb-2">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">{dict.toolsMenu}</p>
        {tools.map(t => (
          <button key={t.id} onClick={() => nav(() => onSelectTool(t.id))}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mb-0.5 transition-all duration-200 font-medium ${
              activeTool === t.id && activeSessionId === null
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
            }`}>
            <span className="text-base w-5 text-center">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-3 my-1" />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-0">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">{dict.chatsMenu}</p>
        {sessions.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">{dict.noChats}</p>}
        {sessions.map(s => (
          <div key={s.id} onClick={() => nav(() => onSelectSession(s.id))}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
              activeSessionId === s.id
                ? "bg-slate-100 text-slate-900 font-medium dark:bg-slate-800 dark:text-slate-200"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5"
            }`}>
            <svg className="w-3.5 h-3.5 flex-none opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="flex-1 text-xs truncate">{s.title}</span>
            <button onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-none p-0.5 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom: User Profile + Prayer Times + Madhhab */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2 bg-slate-50 dark:bg-slate-900/50">
        
        {/* Auth Profile Section */}
        {user ? (
          <div onClick={onProfileClick} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase flex-none">
              {user.email?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mb-0.5">Profile</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onLogoutClick(); }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors flex-none" title="Logout">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {lang === "en" ? "Sign In / Register" : "লগইন করুন"}
          </button>
        )}
        {prayerTimes && (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2.5 space-y-2 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-500/80 font-bold">{prayerTimes.hijri_date}</p>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[["Fajr", prayerTimes.fajr],["Dhuhr", prayerTimes.dhuhr],["Asr", prayerTimes.asr],
                ["Maghrib", prayerTimes.maghrib],["Isha", prayerTimes.isha],["Sunrise", prayerTimes.sunrise]
              ].map(([n, tVal]) => (
                <div 
                  key={n} 
                  onClick={() => nav(() => onSelectTool("tasbeeh"))} 
                  className="text-center cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-800/30 rounded-lg py-1 transition-all active:scale-95"
                >
                  <p className="text-slate-500 dark:text-slate-500">{n}</p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-semibold">{tVal}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide flex-none px-1">{dict.madhhab}</span>
          <select value={madhhab} onChange={e => onMadhhabChange(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-400/50 shadow-sm">
            {MADHHABS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </aside>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function RukayaApp() {
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTool, setActiveTool]   = useState<Tool>("chat");
  const [madhhab, setMadhhab]         = useState("Hanafi");
  const [input, setInput]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation]       = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang]               = useState<Lang>("en");
  const [dailyHadiths, setDailyHadiths] = useState<any[] | null>(null);
  const [showHadithModal, setShowHadithModal] = useState(false);
  const [user, setUser]               = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;
  const messages: Message[] = activeSession?.messages ?? [];
  const dict = t[lang];

  // ── Persistence ──
  useEffect(() => {
    try { 
      const r = localStorage.getItem(SESSIONS_KEY); if (r) setSessions(JSON.parse(r)); 
      const l = localStorage.getItem(LANG_KEY) as Lang; if (l && (l==="en"||l==="bn")) setLang(l);

      // Check URL search params for SEO tool routing
      const searchParams = new URLSearchParams(window.location.search);
      const urlTool = searchParams.get("tool");
      if (urlTool && ["chat", "quran", "ruqyah", "qibla", "zakat", "verifier"].includes(urlTool)) {
        setActiveTool(urlTool as Tool);
      }

      // Check daily hadith
      const today = new Date().toISOString().split('T')[0];
      const lastSeen = localStorage.getItem("rukaya_hadith_date");
      if (lastSeen !== today) {
        fetch('/api/daily-hadith')
          .then(res => res.json())
          .then(data => {
            if (data.hadiths) {
              setDailyHadiths(data.hadiths);
              setShowHadithModal(true);
            }
          })
          .catch(console.error);
      }
    } catch {}

    // Parse URL for recovery type
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("type") === "recovery") {
      setShowResetModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Auth Listeners
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session && window.location.hash.includes('access_token')) {
        // Clean up the ugly Supabase hash from the URL bar after successful OAuth login
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session && window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }

      if (event === "PASSWORD_RECOVERY") {
        setShowResetModal(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Sync Logic ──
  useEffect(() => {
    if (!user || sessions.length === 0) return;
    // Push the latest local sessions up to Supabase to keep them backed up securely.
    const syncData = async () => {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        chat_sessions: sessions,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    };
    syncData();
  }, [user, sessions]);

  const handleSelectTool = (tool: Tool) => {
    setActiveTool(tool);
    window.history.pushState(null, "", tool === "chat" ? "/" : `/?tool=${tool}`);
  };

  const closeHadithModal = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem("rukaya_hadith_date", today);
    setShowHadithModal(false);
  };

  const saveSessions = useCallback((updated: Session[]) => {
    setSessions(updated);
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem(LANG_KEY, newLang); } catch {}
  };

  // ── Location ──
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {}
    );
  }, []);

  // ── Scroll ──
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Session management ──
  const newChat = useCallback(() => {
    setActiveSessionId(null); handleSelectTool("chat"); setError(null); setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const selectSession = (id: string) => { setActiveSessionId(id); handleSelectTool("chat"); setError(null); };
  const deleteSession  = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) setActiveSessionId(null);
  };

  // ── TTS ──
  const speakText = (text: string, id: string, currentlyPlaying: boolean) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // Always stop whatever is playing

    // If it was already playing, this was a "Stop" command.
    if (currentlyPlaying) {
      setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isAudioPlaying: false } : m) })));
      return;
    }

    // Clean text of emojis & markdown that confuse TTS
    const cleanText = text.replace(/[*_~`#\[\]]/g, "").replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

    const voices = window.speechSynthesis.getVoices();
    const av = voices.find(v => v.lang.startsWith("ar") && v.name.includes("Male")) || voices.find(v => v.lang.startsWith("ar"));
    const bv = voices.find(v => v.lang.startsWith("bn"));
    // Prefer Google UK/US voices, or premium iOS voices
    const premiumEn = voices.find(v => v.name.includes("Google UK English Male") || v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Daniel"));
    
    // Chunking helps mobile Safari not crash on long text
    const chunks = cleanText.match(/[^.!?]+[.!?]+|\s+/g) || [cleanText];
    let chunkIndex = 0;

    setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isAudioPlaying: true }  : m) })));

    const speakNextChunk = () => {
      if (chunkIndex >= chunks.length) {
        setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isAudioPlaying: false } : m) })));
        return;
      }

      const chunk = chunks[chunkIndex].trim();
      if (!chunk) { chunkIndex++; speakNextChunk(); return; }

      const u = new SpeechSynthesisUtterance(chunk);
      if (/[\u0600-\u06FF]/.test(chunk) && av) u.voice = av;
      else if (lang === "bn" && bv) u.voice = bv;
      else if (premiumEn) u.voice = premiumEn;

      u.pitch = 1.0;
      u.rate = 1.0;

      u.onend = () => {
        chunkIndex++;
        speakNextChunk();
      };
      
      u.onerror = () => {
        setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isAudioPlaying: false } : m) })));
      };

      window.speechSynthesis.speak(u);
    };

    speakNextChunk();
  };

  // ── Send (streaming) ──
  const handleSend = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isLoading) return;
    setError(null);
    setInput("");
    setActiveTool("chat");

    const userMsg: Message = { id: generateId(), role: "user", content: text };
    let sessionId = activeSessionId;
    let currentMessages: Message[];

    if (!sessionId) {
      const s: Session = { id: generateId(), title: text.slice(0, 42), messages: [userMsg], createdAt: Date.now() };
      setSessions(prev => { const u = [s, ...prev]; try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(u)); } catch {} return u; });
      setActiveSessionId(s.id);
      sessionId = s.id;
      currentMessages = [userMsg];
    } else {
      currentMessages = [...messages, userMsg];
      setSessions(prev => { const u = prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, userMsg], title: getTitle([...s.messages, userMsg]) } : s); try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(u)); } catch {} return u; });
    }

    const replyId = generateId();
    setSessions(prev => { const u = prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, { id: replyId, role: "assistant" as const, content: "" }] } : s); try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(u)); } catch {} return u; });
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })), 
          madhhab, timezone, language: lang, // pass language back to server!
          local_datetime: new Date().toISOString(), latitude: location?.latitude ?? null, longitude: location?.longitude ?? null 
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "token") {
              setSessions(prev => { const u = prev.map(s => s.id === sessionId ? { ...s, messages: s.messages.map(m => m.id === replyId ? { ...m, content: m.content + ev.text } : m) } : s); try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(u)); } catch {} return u; });
            } else if (ev.type === "meta" && ev.prayer_times) {
              setPrayerTimes(ev.prayer_times);
            } else if (ev.type === "error") {
              throw new Error(ev.message);
            }
          } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
        }
      }
    } catch (err) {
      setSessions(prev => { const u = prev.map(s => s.id === sessionId ? { ...s, messages: s.messages.filter(m => m.id !== replyId) } : s); try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(u)); } catch {} return u; });
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeSessionId, messages, madhhab, timezone, location, lang]); // lang added to dependencies

  const showChat = activeTool === "chat";

  return (
    <div className="flex h-[100dvh] bg-slate-50 text-slate-900 overflow-hidden selection:bg-emerald-200 dark:selection:bg-emerald-900">

      {/* Daily Hadith Modal */}
      {showHadithModal && dailyHadiths && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeHadithModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-emerald-100 dark:border-emerald-900/50">
            <h2 className="text-2xl font-bold text-center text-emerald-700 dark:text-emerald-400 mb-6 font-arabic tracking-wide flex items-center justify-center gap-2">
              <span className="text-3xl">✨</span> {lang === "bn" ? "আজকের হাদিস" : "Daily Hadiths"} <span className="text-3xl">✨</span>
            </h2>
            
            <div className="space-y-6">
              {dailyHadiths.map((h, i) => (
                <div key={i} className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm relative">
                  <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">{i + 1}</span>
                  <p className="text-xl font-arabic text-emerald-800 dark:text-emerald-300 leading-loose text-center mb-4 mt-2" dir="rtl">{h.arabic}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 leading-relaxed"><strong>{lang === "bn" ? "অনুবাদ:" : "Translation:"}</strong> {lang === "bn" ? h.bengali : h.english}</p>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-right border-t border-emerald-100 dark:border-emerald-900/50 pt-2 mt-3 flex justify-end items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>{h.source}</p>
                </div>
              ))}
            </div>

            <button onClick={closeHadithModal} className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider">
              {lang === "bn" ? "বিসমিল্লাহ, শুরু করুন" : "Bismillah, Let's Begin"}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full shadow-2xl">
            <Sidebar sessions={sessions} activeSessionId={activeSessionId} activeTool={activeTool}
              madhhab={madhhab} prayerTimes={prayerTimes} lang={lang} user={user} onLangChange={handleLangChange} onNewChat={newChat}
              onSelectSession={selectSession} onDeleteSession={deleteSession}
              onSelectTool={handleSelectTool} onMadhhabChange={setMadhhab}
              onLoginClick={() => setShowAuthModal(true)} onLogoutClick={() => supabase.auth.signOut()} onProfileClick={() => setShowProfileModal(true)}
              onClose={() => setSidebarOpen(false)} isMobile={true} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full flex-none">
        <Sidebar sessions={sessions} activeSessionId={activeSessionId} activeTool={activeTool}
          madhhab={madhhab} prayerTimes={prayerTimes} lang={lang} user={user} onLangChange={handleLangChange} onNewChat={newChat}
          onSelectSession={selectSession} onDeleteSession={deleteSession}
          onSelectTool={handleSelectTool} onMadhhabChange={setMadhhab}
          onLoginClick={() => setShowAuthModal(true)} onLogoutClick={() => supabase.auth.signOut()} onProfileClick={() => setShowProfileModal(true)}
          onClose={() => {}} isMobile={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative">

        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
            {showChat ? (activeSession?.title ?? dict.newChat) : activeTool === "ruqyah" ? dict.toolRuqyah : activeTool === "qibla" ? dict.toolQibla : activeTool === "quran" ? dict.toolQuran : dict.toolZakat}
          </p>
          <button onClick={newChat} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex-none mx-4 mt-3 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/30 rounded-xl flex items-center justify-between text-sm shadow-sm z-10 relative">
            <span className="text-red-700 dark:text-red-300">
              {error.includes("502") || error.toLowerCase().includes("connect")
                ? dict.offline
                : `⚠️ ${error}`}
            </span>
            <button onClick={() => { setError(null); handleSend(); }} className="ml-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex-none">
              {dict.retry}
            </button>
          </div>
        )}

        {/* Tool Views */}
        {!showChat && (
          <div className="flex-1 overflow-y-auto pb-6 lg:pb-0 scroll-smooth">
            {activeTool === "quran" && <QuranReader lang={lang} />}
            {activeTool === "ruqyah" && <RuqyahAudio lang={lang} />}
            {activeTool === "qibla"  && <QiblaFinder lang={lang} />}
            {activeTool === "zakat"  && <ZakatCalculator lang={lang} />}
            {activeTool === "verifier" && <HadithVerifier lang={lang} />}
            {activeTool === "tasbeeh" && <TasbeehCounter lang={lang} />}
          </div>
        )}

        {/* Chat View */}
        {showChat && (
          <>
            <div className="flex-1 overflow-y-auto pb-0 scroll-smooth">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 pb-32 text-center pt-10">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-emerald-600/20 mb-6 font-arabic ring-4 ring-emerald-50 dark:ring-emerald-900/30">
                    ر
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-arabic z-10">{dict.welcomeTitle}</h1>
                  <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 font-arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْم</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 max-w-sm">
                    {dict.welcomeSub}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                    {[dict.suggest1, dict.suggest2, dict.suggest3, dict.suggest4, dict.suggest5, dict.suggest6].map((p, i) => (
                      <button key={i} onClick={() => { setInput(p); setTimeout(() => handleSend(p), 0); }}
                        className="text-left text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 transition-all duration-200 shadow-sm hover:shadow">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                  {messages.map(msg =>
                    msg.role === "assistant"
                      ? (
                        <div key={msg.id} className="flex gap-4 group">
                          <div className="flex-none w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md mt-0.5 font-arabic">ر</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">Rukaya AI</p>
                            <div className="text-slate-800 dark:text-slate-200 text-[16px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content || (
                                <span className="flex items-center gap-2 text-emerald-500">
                                  <span className="flex gap-1.5">
                                    {[0, 0.15, 0.3].map(d => (
                                      <span key={d} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                                    ))}
                                  </span>
                                  <span className="text-sm font-medium italic">{dict.seeking}</span>
                                </span>
                              )}
                            </div>
                            {msg.content && (
                              <button onClick={() => speakText(msg.content, msg.id, msg.isAudioPlaying ?? false)}
                                className={`mt-3 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
                                  msg.isAudioPlaying ? "opacity-100 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                                }`}>
                                {msg.isAudioPlaying ? dict.stop : dict.readAloud}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                      : (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[80%] bg-slate-900 border border-slate-800 text-white dark:bg-emerald-900/30 dark:border-emerald-800/50 rounded-2xl rounded-br-sm px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm break-words">
                            {msg.content}
                          </div>
                        </div>
                      )
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex-none px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] lg:pb-6 pt-3 bg-white dark:bg-slate-950 z-20 border-t border-slate-100 dark:border-slate-900 w-full relative">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-lg focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all duration-200">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={dict.placeholder}
                    rows={1}
                    className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-[15px] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none min-h-[24px] max-h-[180px] leading-relaxed py-0.5"
                    disabled={isLoading}
                  />
                  <button onClick={() => handleSend()} disabled={isLoading || !input.trim()}
                    className="flex-none w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 flex-shrink-0">
                    {isLoading ? (
                       <div className="w-5 h-5 border-2 border-slate-200/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 -rotate-45" fill="currentColor" viewBox="0 0 24 24"><path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" /></svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 hidden sm:block">
                  {dict.disclaimer}
                </p>
              </div>
            </div>
          </>
        )}

      </div>
      
      {/* Global Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} lang={lang} />}
      {showResetModal && <ResetPasswordModal onClose={() => setShowResetModal(false)} lang={lang} />}
      {showProfileModal && <ProfileSettingsModal onClose={() => setShowProfileModal(false)} user={user} lang={lang} />}
    </div>
  );
}
