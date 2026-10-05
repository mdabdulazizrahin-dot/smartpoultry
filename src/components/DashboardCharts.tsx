import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Skull, Egg } from 'lucide-react';
import { FarmData } from '@/types/farm';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface DashboardChartsProps {
  farmData: FarmData;
  selectedMonth: string;
}

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

const formatBengaliCurrency = (amount: number): string => {
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
};

export function DashboardCharts({ farmData, selectedMonth }: DashboardChartsProps) {
  // Prepare last 6 months data
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(today, 5 - i);
    return format(date, 'yyyy-MM');
  });

  // Income & Expense data
  const incomeExpenseData = months.map(month => {
    const monthSales = farmData.eggSales.filter(s => s.date.startsWith(month));
    const income = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const expense = monthSales.reduce((sum, s) => sum + s.accumulatedExpense, 0);
    
    return {
      month: format(parseISO(`${month}-01`), 'MMM', { locale: bn }),
      আয়: income,
      ব্যয়: expense,
    };
  });

  // Mortality data
  const mortalityData = months.map(month => {
    const monthStart = startOfMonth(parseISO(`${month}-01`));
    const monthEnd = endOfMonth(parseISO(`${month}-01`));
    
    const monthMortality = (farmData.flockInfo?.mortalityRecords || [])
      .filter(r => {
        const recordDate = parseISO(r.date);
        return isWithinInterval(recordDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, r) => sum + r.count, 0);
    
    return {
      month: format(parseISO(`${month}-01`), 'MMM', { locale: bn }),
      মৃত্যু: monthMortality,
    };
  });

  // Egg production data (last 14 days)
  const eggProductionData = (farmData.flockInfo?.eggProductions || [])
    .slice(-14)
    .map(p => ({
      date: format(parseISO(p.date), 'dd', { locale: bn }),
      উৎপাদন: p.productionRate,
      ডিম: p.eggsCollected,
    }));

  // Egg sales trend
  const eggSalesData = months.map(month => {
    const monthSales = farmData.eggSales.filter(s => s.date.startsWith(month));
    const totalEggs = monthSales.reduce((sum, s) => {
      const eggs = s.unit === 'crates' ? s.eggsOrCrates * 30 : s.eggsOrCrates;
      return sum + eggs;
    }, 0);
    
    return {
      month: format(parseISO(`${month}-01`), 'MMM', { locale: bn }),
      ডিম: totalEggs,
    };
  });

  const chartConfig = {
    আয়: { label: 'আয়', color: 'hsl(var(--success))' },
    ব্যয়: { label: 'ব্যয়', color: 'hsl(var(--destructive))' },
    মৃত্যু: { label: 'মৃত্যু', color: 'hsl(var(--destructive))' },
    উৎপাদন: { label: 'উৎপাদন হার', color: 'hsl(var(--primary))' },
    ডিম: { label: 'ডিম', color: 'hsl(var(--warning))' },
  };

  return (
    <div className="space-y-4">
      {/* Income vs Expense Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            মাসিক আয় ও ব্যয়
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {incomeExpenseData.some(d => d.আয় > 0 || d.ব্যয় > 0) ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeExpenseData} barGap={2} barCategoryGap="15%">
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => formatBengaliCurrency(Number(value))} />} 
                  />
                  <Bar dataKey="আয়" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="ব্যয়" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <p>ডেটা নেই</p>
            </div>
          )}
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-success" />
              আয়
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-destructive" />
              ব্যয়
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mortality Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" />
            মুরগি মৃত্যু হার
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {mortalityData.some(d => d.মৃত্যু > 0) ? (
            <ChartContainer config={chartConfig} className="h-[150px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mortalityData}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => `${toBengaliNumber(Number(value))} পিস`} />} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="মৃত্যু" 
                    fill="hsl(var(--destructive) / 0.2)" 
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              <p>মৃত্যু রেকর্ড নেই</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Egg Production Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            ডিম উৎপাদন ট্রেন্ড (শেষ ১৪ দিন)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {eggProductionData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[150px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eggProductionData}>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide domain={[0, 100]} />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value, name) => 
                      name === 'উৎপাদন' ? `${toBengaliNumber(Number(value))}%` : `${toBengaliNumber(Number(value))} ডিম`
                    } />} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="উৎপাদন" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              <p>ডিম উৎপাদন রেকর্ড নেই</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Egg Sales Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Egg className="w-5 h-5 text-warning" />
            ডিম বিক্রি ট্রেন্ড
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {eggSalesData.some(d => d.ডিম > 0) ? (
            <ChartContainer config={chartConfig} className="h-[150px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eggSalesData}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => `${toBengaliNumber(Number(value))} ডিম`} />} 
                  />
                  <Bar dataKey="ডিম" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground">
              <p>বিক্রি রেকর্ড নেই</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
