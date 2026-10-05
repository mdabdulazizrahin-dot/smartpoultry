import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';

import type { EggSale, FarmData, MonthlyExpense } from '@/types/farm';

const getMonthlyExpense = (monthlyExpenses: MonthlyExpense[], month: string) => {
  return monthlyExpenses.find((expense) => expense.month === month);
};

const getDaysInMonth = (month: string) => {
  const monthStart = startOfMonth(parseISO(`${month}-01`));
  return differenceInCalendarDays(startOfMonth(addMonths(monthStart, 1)), monthStart);
};

export const calculateDailyFixedExpense = (monthlyExpenses: MonthlyExpense[], month: string): number => {
  const expense = getMonthlyExpense(monthlyExpenses, month);

  if (!expense) {
    return 0;
  }

  const fixedMonthlyExpense = expense.electricity + expense.medicine + expense.otherExpenses;
  return fixedMonthlyExpense / getDaysInMonth(month);
};

export const calculateDailyFeedExpense = (monthlyExpenses: MonthlyExpense[], month: string): number => {
  const expense = getMonthlyExpense(monthlyExpenses, month);

  if (!expense || expense.feedBagPrice <= 0) {
    return 0;
  }

  return (expense.feedBagPrice / 50) * expense.dailyFeedConsumptionKg;
};

export const calculateSaleTotalAmount = (sale: Pick<EggSale, 'eggsOrCrates' | 'unit' | 'ratePerUnit'>) => {
  const totalEggs = sale.unit === 'crates' ? sale.eggsOrCrates * 30 : sale.eggsOrCrates;
  return totalEggs * sale.ratePerUnit;
};

export const calculateAccumulatedExpenseForPeriod = (
  monthlyExpenses: MonthlyExpense[],
  fromDate: Date,
  toDate: Date,
): number => {
  let totalExpense = 0;
  let currentDate = startOfDay(fromDate);
  const endDate = startOfDay(toDate);

  while (currentDate < endDate) {
    const currentMonth = format(currentDate, 'yyyy-MM');
    const nextMonthStart = startOfMonth(addMonths(currentDate, 1));
    const periodEnd = nextMonthStart < endDate ? nextMonthStart : endDate;
    const daysInThisPortion = differenceInCalendarDays(periodEnd, currentDate);

    if (daysInThisPortion > 0) {
      const dailyFixedExpense = calculateDailyFixedExpense(monthlyExpenses, currentMonth);
      const dailyFeedExpense = calculateDailyFeedExpense(monthlyExpenses, currentMonth);
      totalExpense += (dailyFixedExpense + dailyFeedExpense) * daysInThisPortion;
    }

    currentDate = periodEnd;
  }

  return totalExpense;
};

const getBaselineDate = (saleDate: string, arrivalDate?: string) => {
  if (arrivalDate) {
    return parseISO(arrivalDate);
  }

  return startOfMonth(parseISO(saleDate));
};

export const recalculateEggSales = (
  sales: EggSale[],
  monthlyExpenses: MonthlyExpense[],
  arrivalDate?: string,
): EggSale[] => {
  const orderedSales = sales
    .map((sale, originalIndex) => ({ sale, originalIndex }))
    .sort((a, b) => {
      const dateDiff = new Date(a.sale.date).getTime() - new Date(b.sale.date).getTime();
      return dateDiff !== 0 ? dateDiff : a.originalIndex - b.originalIndex;
    });

  const recalculatedSales = new Map<string, EggSale>();

  orderedSales.forEach(({ sale }, index) => {
    const saleDate = parseISO(sale.date);
    const previousSaleDate = index > 0
      ? parseISO(orderedSales[index - 1].sale.date)
      : getBaselineDate(sale.date, arrivalDate);

    const fromDate = previousSaleDate >= saleDate ? addDays(saleDate, -1) : previousSaleDate;
    const totalAmount = calculateSaleTotalAmount(sale);
    const accumulatedExpense = calculateAccumulatedExpenseForPeriod(monthlyExpenses, fromDate, saleDate);

    recalculatedSales.set(sale.id, {
      ...sale,
      totalAmount,
      accumulatedExpense,
      profit: totalAmount - accumulatedExpense,
    });
  });

  return sales.map((sale) => recalculatedSales.get(sale.id) ?? sale);
};

export const syncEggSaleCalculations = (farmData: FarmData): FarmData => ({
  ...farmData,
  eggSales: recalculateEggSales(farmData.eggSales, farmData.monthlyExpenses, farmData.flockInfo?.arrivalDate),
});