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

const FIELD_CONFIG = [
  { key: "gold_grams", label: "Gold", unit: "grams", hint: "Pure gold weight" },
  { key: "silver_grams", label: "Silver", unit: "grams", hint: "Pure silver weight" },
  { key: "cash", label: "Cash & Bank Balance", unit: "USD", hint: "Savings + current account" },
  { key: "business_stock", label: "Business Stock", unit: "USD", hint: "Inventory value" },
  { key: "receivables", label: "Receivables", unit: "USD", hint: "Money owed to you" },
  { key: "debts", label: "Debts (subtract)", unit: "USD", hint: "Short-term liabilities" },
];

const BREAKDOWN_LABELS: Record<string, string> = {
  gold: "Gold", silver: "Silver", cash: "Cash",
  business_stock: "Business Stock", receivables: "Receivables",
};

export default function ZakatCalculator() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [goldPrice, setGoldPrice] = useState("90");
  const [silverPrice, setSilverPrice] = useState("1.0");
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Could not calculate. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-emerald-400">Zakat Calculator</h2>
        <p className="text-sm text-slate-400 mt-1">
          Based on nisab threshold — Hanafi method (lower of gold/silver nisab). 2.5% rate.
        </p>
      </div>

      {/* Metal Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
          <label className="text-xs text-slate-400 block mb-1">Gold price (USD/gram)</label>
          <input
            type="number" value={goldPrice}
            onChange={(e) => setGoldPrice(e.target.value)}
            className="w-full bg-transparent text-emerald-400 font-bold text-lg focus:outline-none"
            placeholder="90"
          />
        </div>
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
          <label className="text-xs text-slate-400 block mb-1">Silver price (USD/gram)</label>
          <input
            type="number" value={silverPrice}
            onChange={(e) => setSilverPrice(e.target.value)}
            className="w-full bg-transparent text-emerald-400 font-bold text-lg focus:outline-none"
            placeholder="1.0"
          />
        </div>
      </div>

      {/* Asset Inputs */}
      <div className="space-y-3">
        {FIELD_CONFIG.map(({ key, label, unit, hint }) => (
          <div key={key} className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-slate-200 text-sm">{label}</span>
                <span className="ml-2 text-xs text-slate-500">{hint}</span>
              </div>
              <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{unit}</span>
            </div>
            <input
              type="number"
              value={values[key] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              placeholder="0"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-2xl py-3.5 font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
      >
        {loading ? "Calculating..." : "Calculate Zakat"}
      </button>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-2xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className={`rounded-2xl border p-5 space-y-4 ${result.zakat_due ? "bg-emerald-950/40 border-emerald-700/40" : "bg-slate-800/60 border-slate-700/40"}`}>
          <div className="text-center">
            {result.zakat_due ? (
              <>
                <p className="text-emerald-400 font-semibold text-sm">Zakat is Due</p>
                <p className="text-4xl font-bold text-white mt-1">
                  ${result.zakat_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-slate-400 text-xs mt-1">2.5% of zakatable wealth</p>
              </>
            ) : (
              <>
                <p className="text-slate-400 font-semibold text-sm">No Zakat Due</p>
                <p className="text-lg text-slate-300 mt-1">Wealth is below nisab threshold</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400">Total Wealth</p>
              <p className="font-bold text-slate-200">${result.total_zakatable_wealth.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <p className="text-slate-400">Nisab Threshold</p>
              <p className="font-bold text-slate-200">${result.nisab_threshold_used.toLocaleString()}</p>
            </div>
          </div>

          {result.zakat_due && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Breakdown by asset</p>
              {Object.entries(result.breakdown).map(([key, val]) =>
                val > 0 ? (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-slate-400">{BREAKDOWN_LABELS[key]}</span>
                    <span className="text-emerald-400 font-medium">${val.toLocaleString()}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 border-t border-slate-700/40 pt-3">{result.note}</p>
        </div>
      )}
    </div>
  );
}
