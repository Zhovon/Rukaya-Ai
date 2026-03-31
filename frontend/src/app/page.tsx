"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const RuqyahAudio     = dynamic(() => import("@/components/RuqyahAudio"),     { ssr: false });
const QiblaFinder     = dynamic(() => import("@/components/QiblaFinder"),     { ssr: false });
const ZakatCalculator = dynamic(() => import("@/components/ZakatCalculator"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────
type Message    = { id: string; role: "user" | "assistant"; content: string; isAudioPlaying?: boolean };
type Session    = { id: string; title: string; messages: Message[]; createdAt: number };
type PrayerTimes = { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string; hijri_date: string };
type Tool       = "chat" | "ruqyah" | "qibla" | "zakat";

const SESSIONS_KEY = "rukaya_sessions";
const MADHHABS     = ["Hanafi", "Maliki", "Shafi'i", "Hanbali"];

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getTitle(msgs: Message[]) {
  const first = msgs.find(m => m.role === "user");
  return first ? first.content.slice(0, 42) + (first.content.length > 42 ? "…" : "") : "New Chat";
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ sessions, activeSessionId, activeTool, madhhab, prayerTimes, onNewChat,
  onSelectSession, onDeleteSession, onSelectTool, onMadhhabChange, onClose, isMobile }: {
  sessions: Session[]; activeSessionId: string | null; activeTool: Tool;
  madhhab: string; prayerTimes: PrayerTimes | null;
  onNewChat: () => void; onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void; onSelectTool: (t: Tool) => void;
  onMadhhabChange: (m: string) => void; onClose: () => void; isMobile: boolean;
}) {
  const tools: { id: Tool; emoji: string; label: string }[] = [
    { id: "ruqyah", emoji: "📖", label: "Ruqyah Audio"      },
    { id: "qibla",  emoji: "🧭", label: "Qibla Finder"     },
    { id: "zakat",  emoji: "⚖️", label: "Zakat Calculator" },
  ];
  const nav = (cb: () => void) => { cb(); if (isMobile) onClose(); };

  return (
    <aside className="flex flex-col h-full w-72 bg-[#0c1220] text-[#c8b99a] border-r border-[rgba(212,168,67,0.12)] islamic-pattern">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[rgba(212,168,67,0.12)] bg-[#0a0f1a]/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-sm font-bold text-[#0a0f1a] shadow-lg gold-glow font-arabic">
            ر
          </div>
          <div>
            <p className="font-bold text-[#f5f0e8] text-sm leading-none">Rukaya AI</p>
            <p className="text-[10px] text-[#7a6a50] mt-0.5 tracking-wide">Islamic Companion</p>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} className="text-[#7a6a50] hover:text-[#c8b99a] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button onClick={() => nav(onNewChat)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-sm font-medium transition-all duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Tools */}
      <div className="px-3 pb-2">
        <p className="text-[10px] font-semibold text-[#5a4a30] uppercase tracking-widest mb-1.5 px-1">Tools</p>
        {tools.map(t => (
          <button key={t.id} onClick={() => nav(() => onSelectTool(t.id))}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm mb-0.5 transition-all duration-200 ${
              activeTool === t.id && activeSessionId === null
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                : "text-[#9a8a6a] hover:bg-white/5 hover:text-[#c8b99a]"
            }`}>
            <span className="text-base w-5 text-center">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-[rgba(212,168,67,0.1)] mx-3 my-1" />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-0">
        <p className="text-[10px] font-semibold text-[#5a4a30] uppercase tracking-widest mb-1.5 px-1">Chats</p>
        {sessions.length === 0 && <p className="text-xs text-[#5a4a30] text-center py-4">No conversations yet</p>}
        {sessions.map(s => (
          <div key={s.id} onClick={() => nav(() => onSelectSession(s.id))}
            className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
              activeSessionId === s.id
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                : "text-[#9a8a6a] hover:bg-white/5 hover:text-[#c8b99a]"
            }`}>
            <svg className="w-3.5 h-3.5 flex-none opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="flex-1 text-xs truncate">{s.title}</span>
            <button onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }}
              className="opacity-0 group-hover:opacity-100 text-[#5a4a30] hover:text-red-400 transition-all flex-none p-0.5 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom: Prayer Times + Madhhab */}
      <div className="border-t border-[rgba(212,168,67,0.12)] p-3 space-y-2 bg-[#0a0f1a]/50">
        {prayerTimes && (
          <div className="bg-amber-500/5 rounded-xl p-2.5 space-y-1 border border-amber-500/10">
            <p className="text-[10px] text-amber-600/80 font-medium">{prayerTimes.hijri_date}</p>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[["Fajr", prayerTimes.fajr],["Dhuhr", prayerTimes.dhuhr],["Asr", prayerTimes.asr],
                ["Maghrib", prayerTimes.maghrib],["Isha", prayerTimes.isha],["Sunrise", prayerTimes.sunrise]
              ].map(([n, t]) => (
                <div key={n} className="text-center">
                  <p className="text-[#5a4a30]">{n}</p>
                  <p className="text-amber-400 font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7a6a50] flex-none">Madhhab:</span>
          <select value={madhhab} onChange={e => onMadhhabChange(e.target.value)}
            className="flex-1 bg-[#0a0f1a] border border-amber-500/20 text-[#c8b99a] text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400/50">
            {MADHHABS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </aside>
  );
}

// ─── Assistant Message ────────────────────────────────────────
function AssistantMessage({ msg, onSpeak }: { msg: Message; onSpeak: (text: string, id: string) => void }) {
  return (
    <div className="flex gap-3 group">
      <div className="flex-none w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-[#0a0f1a] text-xs font-bold shadow-md mt-0.5 flex-shrink-0 font-arabic">
        ر
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-400 mb-1.5">Rukaya AI</p>
        <div className="text-[#e8dcc8] text-[15px] leading-7 whitespace-pre-wrap">
          {msg.content || (
            <span className="flex items-center gap-1.5 text-[#7a6a50]">
              <span className="flex gap-1">
                {[0, 0.15, 0.3].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </span>
              <span className="text-sm">Seeking knowledge…</span>
            </span>
          )}
        </div>
        {msg.content && (
          <button onClick={() => onSpeak(msg.content, msg.id)}
            className={`mt-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all duration-200 ${
              msg.isAudioPlaying ? "opacity-100 bg-amber-500/20 text-amber-400" : "bg-[#101828] text-[#7a6a50] hover:text-amber-400"
            }`}>
            {msg.isAudioPlaying ? "⏸ Stop" : "🔊 Read aloud"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── User Message ─────────────────────────────────────────────
function UserMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-[#0f1e10] border border-[#14532d]/50 text-[#e8dcc8] rounded-2xl rounded-br-sm px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────
function WelcomeScreen({ onPrompt }: { onPrompt: (p: string) => void }) {
  const prompts = [
    "What is the complete Ruqyah for removing evil eye?",
    "What are today's prayer times for my location?",
    "Explain Ayatul Kursi (2:255) with full tafsir",
    "What breaks Wudu according to the Hanafi school?",
    "How do I calculate my Zakat this year?",
    "What does the Prophet ﷺ say about patience (sabr)?",
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pb-32 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-4xl font-bold text-[#0a0f1a] shadow-2xl mb-4 gold-glow font-arabic">
        ر
      </div>
      <h1 className="text-3xl font-bold text-[#f5f0e8] mb-2">Rukaya AI</h1>
      <h2 className="text-lg font-bold text-amber-500/80 mb-6 font-arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْم</h2>
      <p className="text-[#7a6a50] text-sm mb-8 max-w-sm">
        Your Islamic scholarly companion, grounded in authentic Quran & Sunnah
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
        {prompts.map(p => (
          <button key={p} onClick={() => onPrompt(p)}
            className="text-left text-sm text-[#9a8a6a] bg-[#0c1220] hover:bg-[#101828] border border-[rgba(212,168,67,0.12)] hover:border-amber-500/30 rounded-xl px-4 py-3 transition-all duration-200 hover:text-[#e8dcc8]">
            {p}
          </button>
        ))}
      </div>
    </div>
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;
  const messages: Message[] = activeSession?.messages ?? [];

  // ── Persistence ──
  useEffect(() => {
    try { const r = localStorage.getItem(SESSIONS_KEY); if (r) setSessions(JSON.parse(r)); } catch {}
  }, []);

  const saveSessions = useCallback((updated: Session[]) => {
    setSessions(updated);
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated)); } catch {}
  }, []);

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
    setActiveSessionId(null); setActiveTool("chat"); setError(null); textareaRef.current?.focus();
  }, []);

  const selectSession = (id: string) => { setActiveSessionId(id); setActiveTool("chat"); setError(null); };
  const deleteSession  = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) setActiveSessionId(null);
  };

  // ── TTS ──
  const speakText = (text: string, id: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u  = new SpeechSynthesisUtterance(text);
    const av = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ar"));
    if (av && /[\u0600-\u06FF]/.test(text)) u.voice = av;
    u.onstart = () => setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isAudioPlaying: true }  : m) })));
    u.onend   = () => setSessions(prev => prev.map(s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isAudioPlaying: false } : m) })));
    window.speechSynthesis.speak(u);
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
        body: JSON.stringify({ messages: currentMessages.map(m => ({ role: m.role, content: m.content })), madhhab, timezone, local_datetime: new Date().toISOString(), latitude: location?.latitude ?? null, longitude: location?.longitude ?? null }),
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
  }, [input, isLoading, activeSessionId, messages, madhhab, timezone, location]);

  const showChat = activeTool === "chat";

  return (
    <div className="flex h-[100dvh] bg-[#080c16] text-[#f5f0e8] overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar sessions={sessions} activeSessionId={activeSessionId} activeTool={activeTool}
              madhhab={madhhab} prayerTimes={prayerTimes} onNewChat={newChat}
              onSelectSession={selectSession} onDeleteSession={deleteSession}
              onSelectTool={setActiveTool} onMadhhabChange={setMadhhab}
              onClose={() => setSidebarOpen(false)} isMobile={true} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full flex-none">
        <Sidebar sessions={sessions} activeSessionId={activeSessionId} activeTool={activeTool}
          madhhab={madhhab} prayerTimes={prayerTimes} onNewChat={newChat}
          onSelectSession={selectSession} onDeleteSession={deleteSession}
          onSelectTool={setActiveTool} onMadhhabChange={setMadhhab}
          onClose={() => {}} isMobile={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080c16]">

        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[rgba(212,168,67,0.12)] bg-[#0c1220]">
          <button onClick={() => setSidebarOpen(true)} className="text-[#7a6a50] hover:text-[#c8b99a] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-[#c8b99a] truncate max-w-[160px]">
            {showChat ? (activeSession?.title ?? "New Chat") : activeTool === "ruqyah" ? "Ruqyah Audio" : activeTool === "qibla" ? "Qibla Finder" : "Zakat Calculator"}
          </p>
          <button onClick={newChat} className="text-[#7a6a50] hover:text-amber-400 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex-none mx-4 mt-3 px-4 py-3 bg-red-950/40 border border-red-800/30 rounded-xl flex items-center justify-between text-sm">
            <span className="text-red-300">
              {error.includes("502") || error.toLowerCase().includes("connect")
                ? "⚠️ Backend offline — run: python main.py"
                : `⚠️ ${error}`}
            </span>
            <button onClick={() => { setError(null); handleSend(); }} className="ml-3 text-xs text-amber-400 hover:text-amber-300 underline flex-none">
              Retry
            </button>
          </div>
        )}

        {/* Tool Views */}
        {!showChat && (
          <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            {activeTool === "ruqyah" && <RuqyahAudio />}
            {activeTool === "qibla"  && <QiblaFinder />}
            {activeTool === "zakat"  && <ZakatCalculator />}
          </div>
        )}

        {/* Chat View */}
        {showChat && (
          <>
            <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
              {messages.length === 0 ? (
                <WelcomeScreen onPrompt={p => { setInput(p); setTimeout(() => handleSend(p), 0); }} />
              ) : (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                  {messages.map(msg =>
                    msg.role === "assistant"
                      ? <AssistantMessage key={msg.id} msg={msg} onSpeak={speakText} />
                      : <UserMessage key={msg.id} msg={msg} />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex-none px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+76px)] lg:pb-6 pt-3">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-[#0c1220] border border-[rgba(212,168,67,0.2)] rounded-2xl px-4 py-3 shadow-2xl focus-within:border-amber-500/40 transition-colors duration-200">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
                    }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask about Ruqyah, Hadith, Fiqh, prayer times…"
                    rows={1}
                    className="flex-1 bg-transparent text-[#e8dcc8] text-sm placeholder-[#5a4a30] focus:outline-none resize-none min-h-[24px] max-h-[180px] leading-6"
                    disabled={isLoading}
                  />
                  <button onClick={() => handleSend()} disabled={isLoading || !input.trim()}
                    className="flex-none w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-30 text-[#0a0f1a] font-bold flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 flex-shrink-0">
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-[#0a0f1a]/30 border-t-[#0a0f1a] rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 -rotate-45 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-[11px] text-[#4a3a20] mt-2 hidden sm:block">
                  Rukaya AI can make mistakes. Always verify with qualified Islamic scholars.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0c1220]/95 backdrop-blur-md border-t border-[rgba(212,168,67,0.12)] z-30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex">
            {([
              { id: "chat",   emoji: "💬", label: "Chat"   },
              { id: "ruqyah", emoji: "📖", label: "Ruqyah" },
              { id: "qibla",  emoji: "🧭", label: "Qibla"  },
              { id: "zakat",  emoji: "⚖️", label: "Zakat"  },
            ] as { id: Tool; emoji: string; label: string }[]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTool(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors duration-200 ${
                  activeTool === tab.id ? "text-amber-400" : "text-[#5a4a30] hover:text-[#9a8a6a]"
                }`}>
                <span className="text-lg leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
