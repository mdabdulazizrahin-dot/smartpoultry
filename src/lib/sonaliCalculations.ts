import { SonaliBatch, SonaliWeightRecord, SONALI_EXPENSE_CATEGORIES } from '@/types/poultry';

export const toBn = (num: number | string): string => {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (m) => d[parseInt(m)]);
};

export const bnCurrency = (amount: number): string =>
  `৳${toBn(Math.round(amount).toLocaleString('en-US'))}`;

export const bnNum = (n: number, digits = 0): string =>
  toBn(n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }));

// ---- Unit helpers: UI strictly uses grams, internal storage uses kg ----
export const kgToG = (kg: number) => kg * 1000;
export const gToKg = (g: number) => g / 1000;
export const bnGram = (g: number, digits = 0) => `${bnNum(g, digits)} গ্রাম`;

export interface SonaliWeightHistoryRow {
  record: SonaliWeightRecord;
  avgG: number;
  totalG: number;
  prevAvgG: number | null;
  gainG: number | null;
  gainPct: number | null;
  adgG: number | null; // Average Daily Gain in grams / day
  targetG: number | null;
  vsTargetG: number | null;
}

export interface SonaliStats {
  ageDays: number;
  ageWeeks: number;
  ageRemainingDays: number;
  ageFormattedBn: string;
  totalMortality: number;
  todayMortality: number;
  mortalityByReason: { reason: string; count: number }[];
  soldBirds: number;
  totalSoldWeightKg: number;
  avgSaleWeightG: number | null;
  liveBirds: number;
  remainingBirds: number;
  mortalityRate: number;
  totalBags: number;
  totalFeedKg: number; // received
  feedConsumedKg: number;
  remainingFeedKg: number;
  feedCost: number;
  avgDailyFeedKg: number;
  feedCostPerBird: number;
  feedConsumedPerLiveBirdKg: number;
  feedConsumedPerLiveBirdG: number;
  latestAvgWeightG: number | null;
  previousAvgWeightG: number | null;
  weightGainG: number | null;
  weightGainPct: number | null;
  latestAdgG: number | null;
  targetWeightG: number | null;
  weightVsTargetG: number | null;
  growthPct: number | null; // actual / target
  fcr: number | null;
  fcrStatusText: string;
  targetFcr: number | null;
  fcrVsTarget: number | null;
  targetMortalityPct: number | null;
  targetSaleAgeDays: number | null;
  weightHistory: SonaliWeightHistoryRow[];
  medicineCost: number;
  expenseCost: number;
  purchaseCost: number;
  totalCost: number;
  costPerBird: number;
  costPerKg: number | null;
  totalSales: number;
  netProfit: number;
  profitPerBird: number | null;
  profitPerKg: number | null;
}

export type SonaliTargetStatus = 'on' | 'below' | 'above' | 'none';

export const sonaliWeightStatus = (s: SonaliStats): SonaliTargetStatus => {
  if (s.latestAvgWeightG === null || !s.targetWeightG) return 'none';
  const pct = (s.latestAvgWeightG / s.targetWeightG) * 100;
  if (pct >= 105) return 'above';
  if (pct >= 95) return 'on';
  return 'below';
};

// Research reference benchmarks for Bangladesh Sonali (clearly treated as editable reference values)
export const SONALI_BENCHMARKS = {
  saleAgeDays: 65,
  saleWeightG: 900,
  fcr: 2.3,
  mortalityPct: 4.0,
  referenceNote: 'বাংলাদেশের সোনালি মুরগির সাধারণ খামার গবেষণার রেফারেন্স মান (পরিবর্তনযোগ্য)',
};

export function getSonaliStats(batch: SonaliBatch): SonaliStats {
  const today = new Date().toISOString().split('T')[0];
  const arrival = batch.arrivalDate ? new Date(batch.arrivalDate) : null;
  const ageDays = arrival
    ? Math.max(0, Math.floor((Date.now() - arrival.getTime()) / 86400000))
    : 0;
  const ageWeeks = Math.floor(ageDays / 7);
  const ageRemainingDays = ageDays % 7;
  const ageFormattedBn =
    ageWeeks > 0
      ? `${toBn(ageWeeks)} সপ্তাহ ${toBn(ageRemainingDays)} দিন (${toBn(ageDays)} দিন)`
      : `${toBn(ageDays)} দিন`;

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

  const salesList = batch.sales || [];
  const soldBirds = salesList.reduce((s, x) => s + x.birds, 0);
  const totalSoldWeightKg = salesList.reduce((s, x) => s + (x.totalWeightKg || 0), 0);
  const avgSaleWeightG = soldBirds > 0 ? (totalSoldWeightKg / soldBirds) * 1000 : null;

  const liveBirds = Math.max(0, batch.initialCount - totalMortality - soldBirds);
  const remainingBirds = liveBirds;
  const mortalityRate = batch.initialCount > 0 ? (totalMortality / batch.initialCount) * 100 : 0;

  const feedList = batch.feed || [];
  const totalBags = feedList.reduce((s, f) => s + f.bags, 0);
  const totalFeedKg = feedList.reduce((s, f) => s + f.totalKg, 0);
  const feedCost = feedList.reduce((s, f) => s + f.totalCost, 0);
  const feedConsumedKg = (batch.feedConsumption || []).reduce((s, f) => s + f.quantityKg, 0);
  const remainingFeedKg = totalFeedKg - feedConsumedKg;
  const feedUsedKg = feedConsumedKg > 0 ? feedConsumedKg : totalFeedKg;
  const avgDailyFeedKg = ageDays > 0 ? feedUsedKg / ageDays : 0;
  const effectiveBirdsForFeed = liveBirds + soldBirds > 0 ? liveBirds + soldBirds : batch.initialCount;
  const feedCostPerBird = effectiveBirdsForFeed > 0 ? feedCost / effectiveBirdsForFeed : 0;
  const feedConsumedPerLiveBirdKg = liveBirds > 0 ? feedUsedKg / liveBirds : 0;
  const feedConsumedPerLiveBirdG = feedConsumedPerLiveBirdKg * 1000;

  // Weight records sorted by date
  const sortedWeights = [...(batch.weights || [])].sort((a, b) => a.date.localeCompare(b.date));
  const startKg = batch.initialAvgWeight ?? 0.035; // default 35g DOC weight if not entered
  const targetWeightG = batch.targetSaleWeightG ?? null;

  const weightHistory: SonaliWeightHistoryRow[] = sortedWeights.map((w, i) => {
    const prevKg = i > 0 ? sortedWeights[i - 1].avgWeight : startKg;
    const prevDate = i > 0 ? sortedWeights[i - 1].date : batch.arrivalDate;
    const avgG = kgToG(w.avgWeight);
    const prevAvgG = prevKg !== null ? kgToG(prevKg) : null;
    const gainG = prevAvgG !== null ? avgG - prevAvgG : null;
    const gainPct = prevAvgG && prevAvgG > 0 && gainG !== null ? (gainG / prevAvgG) * 100 : null;

    // Calculate ADG (Average Daily Gain in grams / day)
    let adgG: number | null = null;
    if (gainG !== null && prevDate && w.date) {
      const daysDiff = Math.max(1, Math.round((new Date(w.date).getTime() - new Date(prevDate).getTime()) / 86400000));
      adgG = gainG / daysDiff;
    }

    return {
      record: w,
      avgG,
      totalG: kgToG(w.totalSampleWeight),
      prevAvgG,
      gainG,
      gainPct,
      adgG,
      targetG: targetWeightG,
      vsTargetG: targetWeightG ? avgG - targetWeightG : null,
    };
  });

  const last = weightHistory[weightHistory.length - 1] || null;
  const latestAvgWeightG = last ? last.avgG : null;
  const previousAvgWeightG = last ? last.prevAvgG : null;
  const weightGainG = last ? last.gainG : null;
  const weightGainPct = last ? last.gainPct : null;
  const latestAdgG = last ? last.adgG : null;
  const weightVsTargetG = last ? last.vsTargetG : null;
  const growthPct =
    latestAvgWeightG !== null && targetWeightG ? (latestAvgWeightG / targetWeightG) * 100 : null;

  // ---------------- FCR (Feed Conversion Ratio) Calculation ----------------
  // Validated methodology:
  // Feed Consumed (kg) / Total Live Weight Gain (kg)
  // Total Gain = current live birds gain + sold birds gain
  const latestAvgWeightKg = latestAvgWeightG !== null ? gToKg(latestAvgWeightG) : null;
  const currentLiveGainKg =
    liveBirds > 0 && latestAvgWeightKg !== null
      ? Math.max(0, (latestAvgWeightKg - startKg) * liveBirds)
      : 0;
  const soldGainKg =
    soldBirds > 0 && totalSoldWeightKg > 0
      ? Math.max(0, totalSoldWeightKg - soldBirds * startKg)
      : 0;
  const totalGainKg = currentLiveGainKg + soldGainKg;

  let fcr: number | null = null;
  // Reliable FCR condition:
  // 1. Must have feed used
  // 2. Must have positive total live weight gain
  // 3. If there are live birds, we MUST have a recorded sample weight
  if (feedUsedKg > 0 && totalGainKg > 0 && (liveBirds === 0 || latestAvgWeightKg !== null)) {
    fcr = feedUsedKg / totalGainKg;
  }
  const fcrStatusText = fcr !== null ? bnNum(fcr, 2) : 'পর্যাপ্ত ডেটা নেই';
  const targetFcr = batch.targetFcr ?? null;
  const fcrVsTarget = fcr !== null && targetFcr !== null ? fcr - targetFcr : null;

  // Financials
  const medicineCost = (batch.medicines || []).reduce((s, m) => s + m.amount, 0);
  const expenseCost = (batch.expenses || []).reduce((s, e) => s + e.amount, 0);
  const purchaseCost = batch.purchaseCost || 0;
  const totalCost = purchaseCost + feedCost + medicineCost + expenseCost;
  const totalSales = salesList.reduce((s, x) => s + x.totalAmount, 0);
  const netProfit = totalSales - totalCost;

  const costPerBird = effectiveBirdsForFeed > 0 ? totalCost / effectiveBirdsForFeed : 0;
  const totalLiveKgAvailable =
    liveBirds * (latestAvgWeightKg || 0) + totalSoldWeightKg;
  const costPerKg = totalLiveKgAvailable > 0 ? totalCost / totalLiveKgAvailable : null;

  const profitPerBird =
    soldBirds > 0
      ? netProfit / soldBirds
      : liveBirds > 0
      ? netProfit / liveBirds
      : null;
  const profitPerKg = totalSoldWeightKg > 0 ? netProfit / totalSoldWeightKg : null;

  return {
    ageDays,
    ageWeeks,
    ageRemainingDays,
    ageFormattedBn,
    totalMortality,
    todayMortality,
    mortalityByReason,
    soldBirds,
    totalSoldWeightKg,
    avgSaleWeightG,
    liveBirds,
    remainingBirds,
    mortalityRate,
    totalBags,
    totalFeedKg,
    feedConsumedKg,
    remainingFeedKg,
    feedCost,
    avgDailyFeedKg,
    feedCostPerBird,
    feedConsumedPerLiveBirdKg,
    feedConsumedPerLiveBirdG,
    latestAvgWeightG,
    previousAvgWeightG,
    weightGainG,
    weightGainPct,
    latestAdgG,
    targetWeightG,
    weightVsTargetG,
    growthPct,
    fcr,
    fcrStatusText,
    targetFcr,
    fcrVsTarget,
    targetMortalityPct: batch.targetMortalityPct ?? null,
    targetSaleAgeDays: batch.targetSaleAgeDays ?? null,
    weightHistory,
    medicineCost,
    expenseCost,
    purchaseCost,
    totalCost,
    costPerBird,
    costPerKg,
    totalSales,
    netProfit,
    profitPerBird,
    profitPerKg,
  };
}

// Expense totals grouped by category
export const sonaliExpenseByCategory = (batch: SonaliBatch) => {
  const map = new Map<string, number>();
  (batch.expenses || []).forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
  return map;
};
