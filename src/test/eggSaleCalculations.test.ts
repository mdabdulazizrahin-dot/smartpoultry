import { describe, expect, it } from 'vitest';

import { calculateAccumulatedExpenseForPeriod, recalculateEggSales } from '@/lib/eggSaleCalculations';
import type { EggSale, MonthlyExpense } from '@/types/farm';

const monthlyExpenses: MonthlyExpense[] = [
  {
    id: 'jan',
    month: '2026-01',
    electricity: 310,
    medicine: 0,
    feedBagPrice: 500,
    dailyFeedConsumptionKg: 10,
    otherExpenses: 0,
  },
  {
    id: 'feb',
    month: '2026-02',
    electricity: 280,
    medicine: 0,
    feedBagPrice: 500,
    dailyFeedConsumptionKg: 10,
    otherExpenses: 0,
  },
];

describe('egg sale calculations', () => {
  it('counts the full cross-month interval using the correct month rates', () => {
    const expense = calculateAccumulatedExpenseForPeriod(
      monthlyExpenses,
      new Date('2026-01-25T00:00:00'),
      new Date('2026-02-03T00:00:00'),
    );

    expect(expense).toBe(990);
  });

  it('recalculates later sales correctly even when entries were saved out of order', () => {
    const sales: EggSale[] = [
      {
        id: 'feb-sale',
        date: '2026-02-03',
        eggsOrCrates: 100,
        unit: 'eggs',
        ratePerUnit: 10,
        totalAmount: 0,
        accumulatedExpense: 0,
        profit: 0,
      },
      {
        id: 'jan-sale',
        date: '2026-01-25',
        eggsOrCrates: 100,
        unit: 'eggs',
        ratePerUnit: 10,
        totalAmount: 0,
        accumulatedExpense: 0,
        profit: 0,
      },
    ];

    const recalculated = recalculateEggSales(sales, monthlyExpenses, '2026-01-01');
    const febSale = recalculated.find((sale) => sale.id === 'feb-sale');

    expect(febSale?.accumulatedExpense).toBe(990);
    expect(febSale?.profit).toBe(10);
  });
});