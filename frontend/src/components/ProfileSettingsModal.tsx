"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfileSettingsModal({ onClose, user, lang }: { onClose: () => void, user: any, lang: "en" | "bn" }) {
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === user?.email) return onClose();
    
    setLoading(true); setError(null); setSuccess(null);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setSuccess(lang === "en" ? "Check both your old and new email to confirm the change." : "আপনার ইমেইল চেক করুন পরিবর্তন নিশ্চিত করতে।");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{lang === "en" ? "Profile Settings" : "প্রোফাইল সেটিংস"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</div>}
          {success && <div className="text-emerald-500 text-sm p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">{success}</div>}
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{lang === "en" ? "Update Email" : "ইমেইল আপডেট"}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border rounded-xl p-3 bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? "..." : (lang === "en" ? "Save Changes" : "সেভ করুন")}
          </button>
        </form>
      </div>
    </div>
  );
}
