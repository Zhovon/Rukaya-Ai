"use client";

import { useEffect, useState } from "react";

const dict = {
  en: { installApp: "Install App", iosGuide: "To install Rukaya AI, tap the Share icon at the bottom of Safari, and select 'Add to Home Screen'." },
  bn: { installApp: "অ্যাপ ইন্সটল করুন", iosGuide: "ইন্সটল করতে সাফারির নিচের Share আইকনে ট্যাপ করুন এবং 'Add to Home Screen' নির্বাচন করুন।" }
};

export default function PwaInstallButton({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosTutorial, setShowIosTutorial] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined") {
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone);
      
      const ua = window.navigator.userAgent;
      const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIos(ios);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosTutorial(true);
      setTimeout(() => setShowIosTutorial(false), 8000);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else {
      // Fallback if browser doesn't support the event but isn't iOS
      alert("Installation is managed by your browser menu. Try clicking 'Add to Home screen' from your browser settings.");
    }
  };

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <>
      <button 
        onClick={handleInstallClick}
        className="w-full flex items-center gap-2 px-3 py-2.5 mt-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 text-sm font-semibold transition-all shadow-md"
      >
        <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        {dict[lang].installApp}
      </button>

      {/* iOS Modal */}
      {showIosTutorial && (
        <div className="fixed bottom-4 left-4 right-4 bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom flex items-start gap-4">
           <svg className="w-8 h-8 text-emerald-400 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
           <p className="text-white text-sm font-medium leading-relaxed">{dict[lang].iosGuide}</p>
           <button onClick={() => setShowIosTutorial(false)} className="text-slate-400 hover:text-white mt-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      )}
    </>
  );
}
