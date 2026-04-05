"use client";

import { useState } from "react";

type ZakatResult = {
  total_zakatable_wealth: number;
  nisab_gold_usd: number;
  nisab_silver_usd: number;
  nisab_threshold_used: number;
  zakat_due: boolean;
  zakat_amount: number;
  breakdown: Record<string, number>;
  note: string;
};

// -- Dictionaries
const dict = {
  en: {
    title: "Zakat Calculator",
    subtitle: "Based on nisab threshold — Hanafi method (lower of gold/silver nisab). 2.5% rate.",
    goldPrice: "Gold price (USD/gram)",
    silverPrice: "Silver price (USD/gram)",
    calcBtn: "Calculate Zakat",
    calculating: "Calculating...",
    errServer: "Could not calculate. Is the backend running?",
    due: "Zakat is Due",
    notDue: "No Zakat Due",
    notDueDesc: "Wealth is below nisab threshold",
    rateHelp: "2.5% of zakatable wealth",
    totWealth: "Total Wealth",
    nisabThresh: "Nisab Threshold",
    breakdownLabel: "Breakdown by asset",
    fields: {
      gold_grams: { label: "Gold", unit: "grams", hint: "Pure gold weight" },
      silver_grams: { label: "Silver", unit: "grams", hint: "Pure silver weight" },
      cash: { label: "Cash & Bank Balance", unit: "USD", hint: "Savings + current account" },
      business_stock: { label: "Business Stock", unit: "USD", hint: "Inventory value" },
      receivables: { label: "Receivables", unit: "USD", hint: "Money owed to you" },
      debts: { label: "Debts (subtract)", unit: "USD", hint: "Short-term liabilities" },
    },
    breakdown: { gold: "Gold", silver: "Silver", cash: "Cash", business_stock: "Business Stock", receivables: "Receivables" }
  },
  bn: {
    title: "যাকাত ক্যালকুলেটর",
    subtitle: "নিসাব পরিমাণের উপর ভিত্তি করে — হানাফি পদ্ধতি (স্বর্ণ/রৌপ্যের குறைந்த নিসাব)। ২.৫% হার।",
    goldPrice: "স্বর্ণের দাম (USD/গ্রাম)",
    silverPrice: "রৌপ্যের দাম (USD/গ্রাম)",
    calcBtn: "যাকাত হিসাব করুন",
    calculating: "হিসাব করা হচ্ছে...",
    errServer: "হিসাব করা যায়নি। ইন্টারনেট কানেকশন চেক করুন।",
    due: "যাকাত ফরজ হয়েছে",
    notDue: "যাকাত ফরজ হয়নি",
    notDueDesc: "আপনার সম্পদ নিসাবের নিচে রয়েছে",
    rateHelp: "যাকাতযোগ্য সম্পদের ২.৫%",
    totWealth: "মোট সম্পদ",
    nisabThresh: "নিসাবের পরিমাণ",
    breakdownLabel: "সম্পদ অনুযায়ী যাকাতের বিভাজন",
    fields: {
      gold_grams: { label: "স্বর্ণ", unit: "গ্রাম", hint: "বিশুদ্ধ স্বর্ণের ওজন" },
      silver_grams: { label: "রৌপ্য", unit: "গ্রাম", hint: "বিশুদ্ধ রৌপ্যের ওজন" },
      cash: { label: "নগদ ও ব্যাংকের টাকা", unit: "USD", hint: "সঞ্চয় + চলতি হিসাব" },
      business_stock: { label: "ব্যবসায়িক পণ্য", unit: "USD", hint: "স্টকের মূল্য" },
      receivables: { label: "পাওনা টাকা", unit: "USD", hint: "অন্যের কাছে আপনার পাওনা" },
      debts: { label: "ঋণ (বিয়োগ হবে)", unit: "USD", hint: "স্বল্পমেয়াদী দায়" },
    },
    breakdown: { gold: "স্বর্ণ", silver: "রৌপ্য", cash: "নগদ", business_stock: "ব্যবসায়িক পণ্য", receivables: "পাওনা টাকা" }
  }
};

const FIELD_KEYS = ["gold_grams", "silver_grams", "cash", "business_stock", "receivables", "debts"] as const;

export default function ZakatCalculator({ lang = "en" }: { lang?: "en" | "bn" }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [goldPrice, setGoldPrice] = useState("90");
  const [silverPrice, setSilverPrice] = useState("1.0");
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = dict[lang];

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/zakat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gold_grams: parseFloat(values.gold_grams) || 0,
          silver_grams: parseFloat(values.silver_grams) || 0,
          cash: parseFloat(values.cash) || 0,
          business_stock: parseFloat(values.business_stock) || 0,
          receivables: parseFloat(values.receivables) || 0,
          debts: parseFloat(values.debts) || 0,
          gold_price_per_gram: parseFloat(goldPrice) || 90,
          silver_price_per_gram: parseFloat(silverPrice) || 1.0,
        }),
      });
      if (!res.ok) throw new Error("Backend error");
      setResult(await res.json());
    } catch {
      setError(t.errServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{t.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.subtitle}</p>
      </div>

      {/* Metal Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/40 rounded-2xl p-4 shadow-sm">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.goldPrice}</label>
          <input
            type="number" value={goldPrice}
            onChange={(e) => setGoldPrice(e.target.value)}
            className="w-full bg-transparent text-emerald-600 dark:text-emerald-400 font-bold text-lg focus:outline-none"
            placeholder="90"
          />
        </div>
        <div className="bg-white border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/40 rounded-2xl p-4 shadow-sm">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">{t.silverPrice}</label>
          <input
            type="number" value={silverPrice}
            onChange={(e) => setSilverPrice(e.target.value)}
            className="w-full bg-transparent text-emerald-600 dark:text-emerald-400 font-bold text-lg focus:outline-none"
            placeholder="1.0"
          />
        </div>
      </div>

      {/* Asset Inputs */}
      <div className="space-y-3">
        {FIELD_KEYS.map((key) => {
          const cfg = t.fields[key];
          return (
            <div key={key} className="bg-white border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/40 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{cfg.label}</span>
                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-500">{cfg.hint}</span>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">{cfg.unit}</span>
              </div>
              <input
                type="number"
                value={values[key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700/50 rounded-xl px-4 py-2 text-slate-800 dark:text-slate-100 text-sm focus:outline-none font-medium"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:hover:from-emerald-500 dark:hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold transition-all duration-300 shadow-md active:scale-95"
      >
        {loading ? t.calculating : t.calcBtn}
      </button>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-2xl text-red-700 dark:text-red-300 text-sm font-semibold shadow-sm">
          {error}
        </div>
      )}

      {result && (
        <div className={`rounded-2xl border p-5 space-y-4 shadow-sm ${result.zakat_due ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-700/40" : "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/40"}`}>
          <div className="text-center">
            {result.zakat_due ? (
              <>
                <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm tracking-wide uppercase">{t.due}</p>
                <p className="text-4xl font-extrabold text-slate-800 dark:text-white mt-1">
                  ${result.zakat_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">{t.rateHelp}</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm tracking-wide uppercase">{t.notDue}</p>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mt-1">{t.notDueDesc}</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white border border-slate-200 dark:border-transparent dark:bg-slate-800/50 rounded-xl p-3 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t.totWealth}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">${result.total_zakatable_wealth.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-slate-200 dark:border-transparent dark:bg-slate-800/50 rounded-xl p-3 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t.nisabThresh}</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">${result.nisab_threshold_used.toLocaleString()}</p>
            </div>
          </div>

          {result.zakat_due && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">{t.breakdownLabel}</p>
              {Object.entries(result.breakdown).map(([key, val]) =>
                val > 0 ? (
                  <div key={key} className="flex justify-between text-xs py-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{t.breakdown[key as keyof typeof t.breakdown]}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">${val.toLocaleString()}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          <p className="text-xs font-medium text-slate-500 border-t border-slate-200 dark:border-slate-700/40 pt-3">
            {lang === "bn" ? "বি.দ্র: যাকাতের হার নিসাবের ওপর ১ চন্দ্র বছর (হাওল) অতিবাহিত হওয়ার পর প্রযোজ্য। বিস্তারিত জানতে আলেমের পরামর্শ নিন।" : result.note}
          </p>
        </div>
      )}
    </div>
  );
}
