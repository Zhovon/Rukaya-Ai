"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordModal({ onClose, lang }: { onClose: () => void, lang: "en" | "bn" }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(lang === "en" ? "Password updated successfully!" : "পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!");
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 p-6">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
          {lang === "en" ? "Set New Password" : "নতুন পাসওয়ার্ড সেট করুন"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">{error}</div>}
          {success && <div className="text-emerald-500 text-sm p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">{success}</div>}
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder={lang === "en" ? "New Password (min 6 chars)" : "নতুন পাসওয়ার্ড"} 
            className="w-full border rounded-xl p-3 bg-slate-50 dark:bg-slate-950 dark:border-slate-800"
            required 
            minLength={6} 
          />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white rounded-xl p-3 font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "..." : (lang === "en" ? "Update Password" : "আপডেট করুন")}
          </button>
        </form>
      </div>
    </div>
  );
}
