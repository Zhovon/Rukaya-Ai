import { NextRequest, NextResponse } from 'next/server';

const NISAB_GOLD_GRAMS   = 87.48;
const NISAB_SILVER_GRAMS = 612.36;

export async function POST(req: NextRequest) {
  const {
    gold_grams = 0, silver_grams = 0, cash = 0,
    business_stock = 0, receivables = 0, debts = 0,
    gold_price_per_gram = 90, silver_price_per_gram = 1.0,
  } = await req.json();

  const goldValue   = gold_grams * gold_price_per_gram;
  const silverValue = silver_grams * silver_price_per_gram;
  const totalWealth = goldValue + silverValue + cash + business_stock + receivables - debts;

  const nisabGold   = NISAB_GOLD_GRAMS * gold_price_per_gram;
  const nisabSilver = NISAB_SILVER_GRAMS * silver_price_per_gram;
  const nisabThreshold = Math.min(nisabGold, nisabSilver);
  const zakatDue    = totalWealth >= nisabThreshold;
  const zakatAmount = zakatDue ? Math.round(totalWealth * 0.025 * 100) / 100 : 0;

  return NextResponse.json({
    total_zakatable_wealth: Math.round(totalWealth * 100) / 100,
    nisab_gold_usd: Math.round(nisabGold * 100) / 100,
    nisab_silver_usd: Math.round(nisabSilver * 100) / 100,
    nisab_threshold_used: Math.round(nisabThreshold * 100) / 100,
    zakat_due: zakatDue,
    zakat_amount: zakatAmount,
    breakdown: {
      gold:           zakatDue ? Math.round(goldValue * 0.025 * 100) / 100 : 0,
      silver:         zakatDue ? Math.round(silverValue * 0.025 * 100) / 100 : 0,
      cash:           zakatDue ? Math.round(cash * 0.025 * 100) / 100 : 0,
      business_stock: zakatDue ? Math.round(business_stock * 0.025 * 100) / 100 : 0,
      receivables:    zakatDue ? Math.round(receivables * 0.025 * 100) / 100 : 0,
    },
    note: 'Zakat rate is 2.5% of total zakatable wealth above nisab (one lunar year of possession — hawl). Consult a qualified Islamic scholar for your specific situation.',
  });
}
