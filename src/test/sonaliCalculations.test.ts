import { describe, it, expect } from 'vitest';
import { getSonaliStats, kgToG, gToKg } from '@/lib/sonaliCalculations';
import { SonaliBatch, emptySonaliBatch } from '@/types/poultry';

describe('sonaliCalculations', () => {
  it('correctly converts between grams and kilograms', () => {
    expect(kgToG(1.2)).toBe(1200);
    expect(gToKg(1800)).toBe(1.8);
    expect(gToKg(90)).toBe(0.09);
  });

  it('calculates flock and mortality metrics accurately', () => {
    const batch: SonaliBatch = emptySonaliBatch({
      name: 'Batch S-101',
      initialCount: 1000,
      arrivalDate: '2026-08-01',
      purchaseCost: 35000,
    });

    batch.mortality = [
      { id: '1', date: '2026-08-05', count: 10, reason: 'দুর্বল বাচ্চা' },
      { id: '2', date: '2026-08-12', count: 5, reason: 'রোগ' },
    ];

    batch.sales = [
      { id: 's1', date: '2026-09-10', birds: 200, totalWeightKg: 180, pricePerKg: 280, totalAmount: 50400 },
    ];

    const stats = getSonaliStats(batch);

    expect(stats.totalMortality).toBe(15);
    expect(stats.mortalityRate).toBeCloseTo(1.5, 1);
    expect(stats.soldBirds).toBe(200);
    expect(stats.liveBirds).toBe(785); // 1000 - 15 - 200 = 785
    expect(stats.mortalityByReason).toEqual([
      { reason: 'দুর্বল বাচ্চা', count: 10 },
      { reason: 'রোগ', count: 5 },
    ]);
  });

  it('calculates gram-based weights, gain, and ADG', () => {
    const batch: SonaliBatch = emptySonaliBatch({
      initialCount: 500,
      arrivalDate: '2026-08-01',
      initialAvgWeight: 0.035, // 35 grams
      targetSaleWeightG: 900,
    });

    batch.weights = [
      // Day 7: 20 birds weighed 1800g -> 90g/bird
      { id: 'w1', date: '2026-08-08', sampleBirds: 20, totalSampleWeight: 1.8, avgWeight: 0.09 },
      // Day 14: 20 birds weighed 3200g -> 160g/bird
      { id: 'w2', date: '2026-08-15', sampleBirds: 20, totalSampleWeight: 3.2, avgWeight: 0.16 },
    ];

    const stats = getSonaliStats(batch);

    expect(stats.weightHistory.length).toBe(2);

    // Day 7 entry
    const w1 = stats.weightHistory[0];
    expect(w1.avgG).toBe(90);
    expect(w1.totalG).toBe(1800);
    expect(w1.prevAvgG).toBe(35);
    expect(w1.gainG).toBe(55); // 90 - 35
    expect(w1.adgG).toBeCloseTo(55 / 7, 1); // 7.85 g/day

    // Day 14 entry
    const w2 = stats.weightHistory[1];
    expect(w2.avgG).toBe(160);
    expect(w2.prevAvgG).toBe(90);
    expect(w2.gainG).toBe(70); // 160 - 90
    expect(w2.adgG).toBeCloseTo(70 / 7, 1); // 10.0 g/day
    expect(stats.latestAvgWeightG).toBe(160);
    expect(stats.weightGainG).toBe(70);
  });

  it('accurately calculates FCR accounting for live birds, partial sales, and feed', () => {
    const batch: SonaliBatch = emptySonaliBatch({
      initialCount: 1000,
      arrivalDate: '2026-07-01',
      initialAvgWeight: 0.040, // 40g
    });

    // 10 mortality
    batch.mortality = [{ id: 'm1', date: '2026-07-05', count: 10 }];

    // Sold 200 birds with total live weight = 180 kg (avg 900g)
    // Gain from sold birds = 180 kg - (200 * 0.040 kg) = 180 - 8 = 172 kg
    batch.sales = [
      { id: 's1', date: '2026-08-30', birds: 200, totalWeightKg: 180, pricePerKg: 280, totalAmount: 50400 },
    ];

    // 790 remaining live birds with avg weight = 950g (0.950 kg)
    // Gain from live birds = (0.950 - 0.040) * 790 = 0.910 * 790 = 718.9 kg
    batch.weights = [
      { id: 'w1', date: '2026-08-31', sampleBirds: 20, totalSampleWeight: 19.0, avgWeight: 0.95 },
    ];

    // Total feed consumed = 2000 kg
    batch.feedConsumption = [
      { id: 'fc1', date: '2026-08-31', quantityKg: 2000 },
    ];

    // Total live weight gain = 718.9 kg + 172 kg = 890.9 kg
    // FCR = 2000 / 890.9 = ~2.245
    const stats = getSonaliStats(batch);

    expect(stats.fcr).not.toBeNull();
    expect(stats.fcr).toBeCloseTo(2000 / (718.9 + 172), 2);
    expect(stats.fcrStatusText).toBe('২.২৪');
  });

  it('displays "পর্যাপ্ত ডেটা নেই" when data is insufficient for FCR', () => {
    const batch: SonaliBatch = emptySonaliBatch({
      initialCount: 1000,
      arrivalDate: '2026-08-01',
    });

    // No weights recorded, only feed purchase
    batch.feed = [
      { id: 'f1', date: '2026-08-01', bags: 10, bagSizeKg: 50, pricePerBag: 3200, totalKg: 500, totalCost: 32000 },
    ];

    const stats = getSonaliStats(batch);
    expect(stats.fcr).toBeNull();
    expect(stats.fcrStatusText).toBe('পর্যাপ্ত ডেটা নেই');
  });

  it('calculates full profit and loss correctly', () => {
    const batch: SonaliBatch = emptySonaliBatch({
      initialCount: 500,
      purchaseCost: 17500, // 500 chicks * 35 BDT
      arrivalDate: '2026-07-01',
    });

    batch.feed = [
      { id: 'f1', date: '2026-07-02', bags: 20, bagSizeKg: 50, pricePerBag: 3200, totalKg: 1000, totalCost: 64000 },
    ];

    batch.medicines = [
      { id: 'med1', date: '2026-07-10', medicineName: 'Antiseptic', amount: 1500 },
    ];

    batch.expenses = [
      { id: 'exp1', date: '2026-07-15', category: 'electricity', amount: 2000 },
      { id: 'exp2', date: '2026-07-20', category: 'labour', amount: 5000 },
    ];

    // Total cost = 17500 + 64000 + 1500 + 7000 = 90000 BDT
    // Sales = 480 birds * 0.9kg = 432 kg @ 260 BDT = 112,320 BDT
    batch.sales = [
      { id: 's1', date: '2026-08-25', birds: 480, totalWeightKg: 432, pricePerKg: 260, totalAmount: 112320 },
    ];

    const stats = getSonaliStats(batch);

    expect(stats.totalCost).toBe(90000);
    expect(stats.totalSales).toBe(112320);
    expect(stats.netProfit).toBe(22320);
    expect(stats.profitPerBird).toBeCloseTo(22320 / 480, 1);
    expect(stats.profitPerKg).toBeCloseTo(22320 / 432, 1);
  });
});
