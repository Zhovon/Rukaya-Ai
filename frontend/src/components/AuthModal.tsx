"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthModalProps = {
  onClose: () => void;
  lang: "en" | "bn";
};

type AuthMode = "login" | "signup" | "magic" | "forgot";

const t = {
  en: {
    signIn: "Sign In",
    signUp: "Create Account",
    magicLink: "Sign in with Magic Link",
    forgotPass: "Reset Password",
    email: "Email Address",
    password: "Password",
    submitSignIn: "Login to Rukaya",
    submitSignUp: "Register Account",
    submitMagic: "Send Magic Link",
    submitForgot: "Send Reset Instructions",
    switchSignUp: "Don't have an account? Register",
    switchSignIn: "Already have an account? Sign in",
    switchForgot: "Forgot your password?",
    switchMagic: "Sign in without a password",
    loading: "Please wait...",
    checkEmail: "Check your email for a confirmation link to complete registration.",
    magicSent: "Magic link sent! Check your email to sign in.",
    forgotSent: "Password reset instructions sent to your email.",
    orContinue: "Or continue with",
  },
  bn: {
    signIn: "লগইন করুন",
    signUp: "অ্যাকাউন্ট তৈরি করুন",
    magicLink: "ম্যাজিক লিংক দিয়ে লগইন",
    forgotPass: "পাসওয়ার্ড রিসেট",
    email: "ইমেইল অ্যাড্রেস",
    password: "পাসওয়ার্ড",
    submitSignIn: "লগইন",
    submitSignUp: "রেজিস্টার",
    submitMagic: "ম্যাজিক লিংক পাঠান",
    submitForgot: "রিসেট ইনস্ট্রাকশন পাঠান",
    switchSignUp: "অ্যাকাউন্ট নেই? রেজিস্টার করুন",
    switchSignIn: "আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন",
    switchForgot: "পাসওয়ার্ড ভুলে গেছেন?",
    switchMagic: "পাসওয়ার্ড ছাড়া লগইন করুন",
    loading: "অপেক্ষা করুন...",
    checkEmail: "আপনার ইমেইলে একটি কনফার্মেশন লিংক পাঠানো হয়েছে।",
    magicSent: "ম্যাজিক লিংক পাঠানো হয়েছে! ইমেইল চেক করুন।",
    forgotSent: "পাসওয়ার্ড রিসেট ইনস্ট্রাকশন ইমেইলে পাঠানো হয়েছে।",
    orContinue: "অথবা কন্টিনিউ করুন",
  }
};

export default function AuthModal({ onClose, lang }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const dict = t[lang];

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "OAuth error occurred.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose(); // Automatically close on successful login
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(dict.checkEmail);
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setSuccess(dict.magicSent);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?type=recovery` });
        if (error) throw error;
        setSuccess(dict.forgotSent);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex-none px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-arabic text-sm">র</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {mode === "login" ? dict.signIn : mode === "signup" ? dict.signUp : mode === "magic" ? dict.magicLink : dict.forgotPass}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {(mode === "login" || mode === "signup") && (
              <div className="space-y-3 pb-3">
                <button type="button" onClick={() => handleOAuth('google')} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl transition-all shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </button>
                <button type="button" onClick={() => handleOAuth('github')} className="w-full flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1b1f23] text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  GitHub
                </button>

                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                  <span className="px-3 text-xs text-slate-400 font-medium">{dict.orContinue}</span>
                  <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                </div>
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

            {(mode === "login" || mode === "signup") && (
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
                {mode === "login" && (
                  <div className="flex justify-between mt-2">
                    <button type="button" onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                      {dict.switchForgot}
                    </button>
                    <button type="button" onClick={() => { setMode("magic"); setError(null); setSuccess(null); }} className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {dict.switchMagic}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 mt-4"
            >
              {loading ? dict.loading : (mode === "login" ? dict.submitSignIn : mode === "signup" ? dict.submitSignUp : mode === "magic" ? dict.submitMagic : dict.submitForgot)}
            </button>

            <button 
              type="button" 
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
              className="w-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mt-4"
            >
              {mode === "login" ? dict.switchSignUp : dict.switchSignIn}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
