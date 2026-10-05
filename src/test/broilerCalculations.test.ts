import { describe, it, expect } from 'vitest';
import { getBroilerStats, kgToG, gToKg } from '@/lib/broilerCalculations';
import { BroilerBatch, emptyBroilerBatch } from '@/types/poultry';

describe('broilerCalculations', () => {
  it('correctly converts between grams and kilograms for broiler measurements', () => {
    expect(kgToG(2.1)).toBe(2100);
    expect(gToKg(2100)).toBe(2.1);
    expect(gToKg(40)).toBe(0.04);
    expect(kgToG(0.04)).toBe(40);
  });

  it('calculates broiler flock and mortality metrics accurately', () => {
    const batch: BroilerBatch = emptyBroilerBatch({
      name: 'Batch B-101',
      initialCount: 1000,
      arrivalDate: '2026-08-01',
      purchaseCost: 50000,
    });

    batch.mortality = [
      { id: '1', date: '2026-08-05', count: 12, reason: 'দুর্বল বাচ্চা' },
      { id: '2', date: '2026-08-15', count: 8, reason: 'গরমে চাপ' },
    ];

    batch.sales = [
      { id: 's1', date: '2026-09-05', birds: 300, totalWeightKg: 630, pricePerKg: 180, totalAmount: 113400 },
    ];

    const stats = getBroilerStats(batch);

    expect(stats.totalMortality).toBe(20);
    expect(stats.mortalityRate).toBeCloseTo(2.0, 1);
    expect(stats.soldBirds).toBe(300);
    expect(stats.liveBirds).toBe(680); // 1000 - 20 - 300 = 680
    expect(stats.remainingBirds).toBe(680);
    expect(stats.mortalityByReason).toEqual([
      { reason: 'দুর্বল বাচ্চা', count: 12 },
      { reason: 'গরমে চাপ', count: 8 },
    ]);
  });

  it('calculates gram-based weights, gain, and ADG for broilers', () => {
    const batch: BroilerBatch = emptyBroilerBatch({
      initialCount: 1000,
      arrivalDate: '2026-08-01',
      initialAvgWeight: 0.040, // 40 grams DOC
      targetSaleWeightG: 2100,
    });

    batch.weights = [
      // Day 7: 20 birds weighed 3600g -> 180g/bird
      { id: 'w1', date: '2026-08-08', sampleBirds: 20, totalSampleWeight: 3.6, avgWeight: 0.18 },
      // Day 14: 20 birds weighed 9000g -> 450g/bird
      { id: 'w2', date: '2026-08-15', sampleBirds: 20, totalSampleWeight: 9.0, avgWeight: 0.45 },
    ];

    const stats = getBroilerStats(batch);

    expect(stats.weightHistory.length).toBe(2);

    // Day 7 entry
    const w1 = stats.weightHistory[0];
    expect(w1.avgG).toBe(180);
    expect(w1.totalG).toBe(3600);
    expect(w1.prevAvgG).toBe(40);
    expect(w1.gainG).toBe(140); // 180 - 40
    expect(w1.adgG).toBeCloseTo(140 / 7, 1); // 20.0 g/day

    // Day 14 entry
    const w2 = stats.weightHistory[1];
    expect(w2.avgG).toBe(450);
    expect(w2.prevAvgG).toBe(180);
    expect(w2.gainG).toBe(270); // 450 - 180
    expect(w2.adgG).toBeCloseTo(270 / 7, 1); // 38.57 g/day
    expect(stats.latestAvgWeightG).toBe(450);
    expect(stats.weightGainG).toBe(270);
  });

  it('accurately calculates Broiler FCR accounting for live birds, partial sales, and feed', () => {
    const batch: BroilerBatch = emptyBroilerBatch({
      initialCount: 1000,
      arrivalDate: '2026-08-01',
      initialAvgWeight: 0.040, // 40g DOC
    });

    // 20 mortality
    batch.mortality = [{ id: 'm1', date: '2026-08-05', count: 20 }];

    // Sold 300 birds at day 32 with total live weight = 600 kg (avg 2.0 kg)
    // Gain from sold birds = 600 kg - (300 * 0.040 kg) = 600 - 12 = 588 kg
    batch.sales = [
      { id: 's1', date: '2026-09-02', birds: 300, totalWeightKg: 600, pricePerKg: 180, totalAmount: 108000 },
    ];

    // Remaining live birds = 1000 - 20 - 300 = 680 birds
    // Day 35 sample weight = 2.1 kg (2100g)
    // Gain from live birds = (2.1 - 0.040) * 680 = 2.06 * 680 = 1400.8 kg
    batch.weights = [
      { id: 'w1', date: '2026-09-05', sampleBirds: 20, totalSampleWeight: 42.0, avgWeight: 2.1 },
    ];

    // Total Live Gain = 1400.8 + 588 = 1988.8 kg
    // Feed consumed = 3082.64 kg -> Expected FCR = 3082.64 / 1988.8 = 1.55
    batch.feedConsumption = [
      { id: 'fc1', date: '2026-09-05', quantityKg: 3082.64 },
    ];

    const stats = getBroilerStats(batch);

    expect(stats.fcr).not.toBeNull();
    expect(stats.fcr!).toBeCloseTo(1.55, 2);
  });

  it('handles insufficient data gracefully by returning null FCR and "পর্যাপ্ত ডেটা নেই"', () => {
    const batch: BroilerBatch = emptyBroilerBatch({
      initialCount: 1000,
      arrivalDate: '2026-08-01',
    });

    // Case 1: No feed and no weights
    let stats = getBroilerStats(batch);
    expect(stats.fcr).toBeNull();
    expect(stats.fcrStatusText).toBe('পর্যাপ্ত ডেটা নেই');

    // Case 2: Feed exists but no weight records
    batch.feedConsumption = [{ id: 'fc1', date: '2026-08-10', quantityKg: 500 }];
    stats = getBroilerStats(batch);
    expect(stats.fcr).toBeNull();
    expect(stats.fcrStatusText).toBe('পর্যাপ্ত ডেটা নেই');

    // Case 3: Weight exists but no feed used
    batch.feedConsumption = [];
    batch.weights = [{ id: 'w1', date: '2026-08-10', sampleBirds: 10, totalSampleWeight: 5.0, avgWeight: 0.5 }];
    stats = getBroilerStats(batch);
    expect(stats.fcr).toBeNull();
    expect(stats.fcrStatusText).toBe('পর্যাপ্ত ডেটা নেই');
  });

  it('tracks feed inventory, stock balance, and feed consumption per bird', () => {
    const batch: BroilerBatch = emptyBroilerBatch({
      initialCount: 1000,
      arrivalDate: '2026-08-01',
    });

    // Purchased 40 bags of 50kg = 2000kg for 3500/bag = 140,000 BDT
    batch.feed = [
      { id: 'f1', date: '2026-08-01', bags: 40, bagSizeKg: 50, pricePerBag: 3500, totalKg: 2000, totalCost: 140000 },
    ];

    // Consumed 1200kg
    batch.feedConsumption = [
      { id: 'c1', date: '2026-08-10', quantityKg: 1200 },
    ];

    const stats = getBroilerStats(batch);

    expect(stats.totalFeedKg).toBe(2000);
    expect(stats.feedConsumedKg).toBe(1200);
    expect(stats.remainingFeedKg).toBe(800); // 2000 - 1200 = 800 kg
    expect(stats.feedCost).toBe(140000);
    expect(stats.feedConsumedPerLiveBirdKg).toBeCloseTo(1.2, 1); // 1200 / 1000
    expect(stats.feedConsumedPerLiveBirdG).toBe(1200);
  });

  it('correctly calculates Broiler financials, production cost per bird/kg, and net profit/loss', () => {
    const batch: BroilerBatch = emptyBroilerBatch({
      initialCount: 1000,
      arrivalDate: '2026-08-01',
      purchaseCost: 50000, // 1000 chicks @ 50 BDT
    });

    // Feed cost = 140,000 BDT
    batch.feed = [
      { id: 'f1', date: '2026-08-01', bags: 40, bagSizeKg: 50, pricePerBag: 3500, totalKg: 2000, totalCost: 140000 },
    ];

    // Medicine = 5,000 BDT
    batch.medicines = [
      { id: 'm1', date: '2026-08-05', medicineName: 'ভিটামিন ও স্যালাইন', amount: 5000 },
    ];

    // Expenses: Gas/Brooding 4,000 + Electricity 3,000 = 7,000 BDT
    batch.expenses = [
      { id: 'e1', date: '2026-08-02', category: 'gas', amount: 4000 },
      { id: 'e2', date: '2026-08-15', category: 'electricity', amount: 3000 },
    ];

    // Total Cost = 50,000 + 140,000 + 5,000 + 7,000 = 202,000 BDT

    // Sales: 950 birds (50 mortality), total weight 1995 kg @ 185 BDT/kg = 369,075 BDT
    batch.mortality = [{ id: 'd1', date: '2026-08-03', count: 50 }];
    batch.sales = [
      { id: 's1', date: '2026-09-05', birds: 950, totalWeightKg: 1995, pricePerKg: 185, totalAmount: 369075 },
    ];

    const stats = getBroilerStats(batch);

    expect(stats.totalCost).toBe(202000);
    expect(stats.totalSales).toBe(369075);
    expect(stats.netProfit).toBe(167075); // 369,075 - 202,000 = +167,075
    expect(stats.costPerBird).toBeCloseTo(202000 / 950, 1);
    expect(stats.costPerKg).toBeCloseTo(202000 / 1995, 1);
    expect(stats.profitPerBird).toBeCloseTo(167075 / 950, 1);
    expect(stats.profitPerKg).toBeCloseTo(167075 / 1995, 1);
  });
});
