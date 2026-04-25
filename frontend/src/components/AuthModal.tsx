"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthModalProps = {
  onClose: () => void;
  lang: "en" | "bn";
};

const t = {
  en: {
    signIn: "Sign In",
    signUp: "Create Account",
    email: "Email Address",
    password: "Password",
    submitSignIn: "Login to Rukaya",
    submitSignUp: "Register Account",
    switchSignUp: "Don't have an account? Register",
    switchSignIn: "Already have an account? Sign in",
    loading: "Please wait...",
    checkEmail: "Check your email for a confirmation link to complete registration.",
  },
  bn: {
    signIn: "লগইন করুন",
    signUp: "অ্যাকাউন্ট তৈরি করুন",
    email: "ইমেইল অ্যাড্রেস",
    password: "পাসওয়ার্ড",
    submitSignIn: "লগইন",
    submitSignUp: "রেজিস্টার",
    switchSignUp: "অ্যাকাউন্ট নেই? রেজিস্টার করুন",
    switchSignIn: "আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন",
    loading: "অপেক্ষা করুন...",
    checkEmail: "আপনার ইমেইলে একটি কনফার্মেশন লিংক পাঠানো হয়েছে।",
  }
};

export default function AuthModal({ onClose, lang }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const dict = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose(); // Automatically close on successful login
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(dict.checkEmail);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-arabic text-sm">র</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{isLogin ? dict.signIn : dict.signUp}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{dict.email}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{dict.password}</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 mt-2"
          >
            {loading ? dict.loading : (isLogin ? dict.submitSignIn : dict.submitSignUp)}
          </button>

          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
            className="w-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mt-4"
          >
            {isLogin ? dict.switchSignUp : dict.switchSignIn}
          </button>
        </form>

      </div>
    </div>
  );
}
