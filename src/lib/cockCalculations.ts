import { CockBatch, CockWeightRecord } from '@/types/poultry';

export const toBn = (num: number | string): string => {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (m) => d[parseInt(m)]);
};

export const bnCurrency = (amount: number): string =>
  `৳${toBn(Math.round(amount).toLocaleString('en-US'))}`;

export const bnNum = (n: number, digits = 0): string =>
  toBn(n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }));

// ---- Unit helpers: UI uses grams, storage uses kg ----
export const kgToG = (kg: number) => kg * 1000;
export const gToKg = (g: number) => g / 1000;
export const bnGram = (g: number, digits = 0) => `${bnNum(g, digits)} গ্রাম`;

export interface WeightHistoryRow {
  record: CockWeightRecord;
  avgG: number;
  totalG: number;
  prevAvgG: number | null;
  gainG: number | null;
  gainPct: number | null;
  targetG: number | null;
  vsTargetG: number | null;
}

export interface CockStats {
  ageDays: number;
  ageWeeks: number;
  totalMortality: number;
  todayMortality: number;
  mortalityByReason: { reason: string; count: number }[];
  soldBirds: number;
  liveBirds: number;
  mortalityRate: number;
  totalBags: number;
  totalFeedKg: number; // received
  feedConsumedKg: number;
  remainingFeedKg: number;
  feedCost: number;
  avgDailyFeedKg: number;
  latestAvgWeightG: number | null;
  previousAvgWeightG: number | null;
  weightGainG: number | null;
  weightGainPct: number | null;
  targetWeightG: number | null;
  weightVsTargetG: number | null;
  growthPct: number | null; // actual / target
  fcr: number | null;
  targetFcr: number | null;
  targetMortalityPct: number | null;
  targetSaleAgeDays: number | null;
  weightHistory: WeightHistoryRow[];
  medicineCost: number;
  expenseCost: number;
  purchaseCost: number;
  totalCost: number;
  totalSales: number;
  netProfit: number;
}

export type TargetStatus = 'on' | 'below' | 'above' | 'none';

export const weightStatus = (s: CockStats): TargetStatus => {
  if (s.latestAvgWeightG === null || !s.targetWeightG) return 'none';
  const pct = (s.latestAvgWeightG / s.targetWeightG) * 100;
  if (pct >= 105) return 'above';
  if (pct >= 95) return 'on';
  return 'below';
};

export function getCockStats(batch: CockBatch): CockStats {
  const today = new Date().toISOString().split('T')[0];
  const arrival = batch.arrivalDate ? new Date(batch.arrivalDate) : null;
  const ageDays = arrival
    ? Math.max(0, Math.floor((Date.now() - arrival.getTime()) / 86400000))
    : 0;

  const mortalityList = batch.mortality || [];
  const totalMortality = mortalityList.reduce((s, m) => s + m.count, 0);
  const todayMortality = mortalityList
    .filter((m) => m.date === today)
    .reduce((s, m) => s + m.count, 0);
  const reasonMap = new Map<string, number>();
  mortalityList.forEach((m) => {
    const key = m.reason?.trim() || 'অজানা';
    reasonMap.set(key, (reasonMap.get(key) || 0) + m.count);
  });
  const mortalityByReason = [...reasonMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const soldBirds = (batch.sales || []).reduce((s, x) => s + x.birds, 0);
  const liveBirds = Math.max(0, batch.initialCount - totalMortality - soldBirds);
  const mortalityRate = batch.initialCount > 0 ? (totalMortality / batch.initialCount) * 100 : 0;

  const feedList = batch.feed || [];
  const totalBags = feedList.reduce((s, f) => s + f.bags, 0);
  const totalFeedKg = feedList.reduce((s, f) => s + f.totalKg, 0);
  const feedCost = feedList.reduce((s, f) => s + f.totalCost, 0);
  const feedConsumedKg = (batch.feedConsumption || []).reduce((s, f) => s + f.quantityKg, 0);
  const remainingFeedKg = totalFeedKg - feedConsumedKg;
  // Feed actually used for performance maths: consumption log when kept, else all received
  const feedUsedKg = feedConsumedKg > 0 ? feedConsumedKg : totalFeedKg;
  const avgDailyFeedKg = ageDays > 0 ? feedUsedKg / ageDays : 0;

  const sortedWeights = [...(batch.weights || [])].sort((a, b) => a.date.localeCompare(b.date));
  const startKg = batch.initialAvgWeight ?? null;
  const targetWeightG = batch.targetSaleWeightG ?? null;

  const weightHistory: WeightHistoryRow[] = sortedWeights.map((w, i) => {
    const prevKg = i > 0 ? sortedWeights[i - 1].avgWeight : startKg;
    const avgG = kgToG(w.avgWeight);
    const prevAvgG = prevKg !== null ? kgToG(prevKg) : null;
    const gainG = prevAvgG !== null ? avgG - prevAvgG : null;
    const gainPct = prevAvgG && prevAvgG > 0 && gainG !== null ? (gainG / prevAvgG) * 100 : null;
    return {
      record: w,
      avgG,
      totalG: kgToG(w.totalSampleWeight),
      prevAvgG,
      gainG,
      gainPct,
      targetG: targetWeightG,
      vsTargetG: targetWeightG ? avgG - targetWeightG : null,
    };
  });

  const last = weightHistory[weightHistory.length - 1] || null;
  const latestAvgWeightG = last ? last.avgG : null;
  const previousAvgWeightG = last ? last.prevAvgG : null;
  const weightGainG = last ? last.gainG : null;
  const weightGainPct = last ? last.gainPct : null;
  const weightVsTargetG = last ? last.vsTargetG : null;
  const growthPct =
    latestAvgWeightG !== null && targetWeightG ? (latestAvgWeightG / targetWeightG) * 100 : null;

  // FCR = feed consumed (kg) / total live-weight gain (kg)
  const latestKg = latestAvgWeightG !== null ? gToKg(latestAvgWeightG) : null;
  let fcr: number | null = null;
  if (latestKg !== null && startKg !== null && feedUsedKg > 0 && liveBirds > 0) {
    const gainTotal = (latestKg - startKg) * liveBirds;
    if (gainTotal > 0) fcr = feedUsedKg / gainTotal;
  }

  const medicineCost = (batch.medicines || []).reduce((s, m) => s + m.amount, 0);
  const expenseCost = (batch.expenses || []).reduce((s, e) => s + e.amount, 0);
  const purchaseCost = batch.purchaseCost || 0;
  const totalCost = purchaseCost + feedCost + medicineCost + expenseCost;
  const totalSales = (batch.sales || []).reduce((s, x) => s + x.totalAmount, 0);

  return {
    ageDays,
    ageWeeks: Math.floor(ageDays / 7),
    totalMortality,
    todayMortality,
    mortalityByReason,
    soldBirds,
    liveBirds,
    mortalityRate,
    totalBags,
    totalFeedKg,
    feedConsumedKg,
    remainingFeedKg,
    feedCost,
    avgDailyFeedKg,
    latestAvgWeightG,
    previousAvgWeightG,
    weightGainG,
    weightGainPct,
    targetWeightG,
    weightVsTargetG,
    growthPct,
    fcr,
    targetFcr: batch.targetFcr ?? null,
    targetMortalityPct: batch.targetMortalityPct ?? null,
    targetSaleAgeDays: batch.targetSaleAgeDays ?? null,
    weightHistory,
    medicineCost,
    expenseCost,
    purchaseCost,
    totalCost,
    totalSales,
    netProfit: totalSales - totalCost,
  };
}

// Expense totals grouped by category (labour, electricity, ...)
export const expenseByCategory = (batch: CockBatch) => {
  const map = new Map<string, number>();
  (batch.expenses || []).forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
  return map;
};
