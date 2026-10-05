import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Scale,
  Wheat,
  HeartPulse,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { BroilerBatch, BROILER_EXPENSE_CATEGORIES, BROILER_BREEDS } from '@/types/poultry';
import {
  getBroilerStats,
  bnCurrency,
  bnNum,
  toBn,
  broilerWeightStatus,
  gToKg,
} from '@/lib/broilerCalculations';

interface Props {
  batch: BroilerBatch;
}

export function BroilerDashboard({ batch }: Props) {
  const s = getBroilerStats(batch);
  const status = broilerWeightStatus(s);
  const breedLabel = BROILER_BREEDS.find((b) => b.id === batch.breed)?.label || batch.breed || 'ব্রয়লার';

  const statusLabel =
    status === 'above'
      ? '✅ লক্ষ্যের উপরে বৃদ্ধি'
      : status === 'on'
      ? '✅ লক্ষ্য অনুযায়ী চলছে'
      : status === 'below'
      ? '⚠️ লক্ষ্যের নিচে ওজন'
      : '';
  const statusTone =
    status === 'below'
      ? 'bg-destructive/10 text-destructive border border-destructive/20'
      : status === 'none'
      ? ''
      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';

  // Weight chart data
  const growthData = s.weightHistory.map((h) => ({
    date: h.record.date.slice(5),
    'বাস্তব গড় (গ্রাম)': Math.round(h.avgG),
    'টার্গেট (গ্রাম)': h.targetG ? Math.round(h.targetG) : undefined,
    'ADG (গ্রাম/দিন)': h.adgG !== null ? Number(h.adgG.toFixed(1)) : undefined,
  }));

  // Daily mortality chart data (last 8 entries)
  const mortalityData = [...(batch.mortality || [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map((m) => ({
      date: m.date.slice(5),
      'মৃত সংখ্যা': m.count,
    }));

  // Feed consumption chart data (last 8 entries)
  const feedUsageData = [...(batch.feedConsumption || [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-8)
    .map((f) => ({
      date: f.date.slice(5),
      'খাদ্য (কেজি)': f.quantityKg,
    }));

  // Next upcoming vaccine
  const today = new Date().toISOString().split('T')[0];
  const upcomingVaccine = (batch.vaccines || [])
    .filter((v) => v.status === 'pending')
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))[0];

  // Expense by category
  const expByCat = BROILER_EXPENSE_CATEGORIES.map((cat) => {
    const total = (batch.expenses || [])
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return { label: cat.label, total };
  }).filter((c) => c.total > 0);

  return (
    <div className="space-y-4">
      {/* 1. Main Hero Financial Summary (Layer Green Theme) */}
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/20">
              🍗 {batch.name} • {breedLabel}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/15">
              বয়স: {s.ageFormattedBn}
            </span>
          </div>

          <div className="card-icon-3d inline-block mb-2">
            <Wallet className="w-10 h-10 opacity-90" />
          </div>

          <p className="text-sm opacity-90 mb-1">
            {s.netProfit >= 0 ? 'আনুমানিক লাভ' : 'আনুমানিক লাভ / ক্ষতি'}
          </p>
          <p className="text-4xl font-bold tracking-tight">
            {s.netProfit >= 0 ? bnCurrency(s.netProfit) : `-${bnCurrency(Math.abs(s.netProfit))}`}
          </p>
          <p className="text-sm mt-2 opacity-85">
            {s.netProfit >= 0 ? '📈 ভালো চলছে!' : '📈 চলমান ব্যাচ'}
          </p>
        </CardContent>
      </Card>

      {/* 2. Income and Expense Cards (Green & Red like Layer) */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-4 bg-gradient-to-br from-success/90 to-success text-success-foreground">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 p-1.5 rounded-lg text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">মোট আয়</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold truncate">{bnCurrency(s.totalSales)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-4 bg-gradient-to-br from-destructive/90 to-destructive text-destructive-foreground">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white/20 p-1.5 rounded-lg text-white">
                <TrendingDown className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">মোট ব্যয়</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold truncate">{bnCurrency(s.totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Flock & Livestock Overview */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>ফ্লক ও মৃত্যুর হিসাব</span>
            </CardTitle>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              জীবিত: {bnNum(s.liveBirds)} টি
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Initial */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-center">
              <div className="text-xs text-muted-foreground mb-1 font-medium">প্রাথমিক বাচ্চা</div>
              <div className="text-xl font-bold text-foreground">
                {bnNum(batch.initialCount)} <span className="text-xs font-normal text-muted-foreground">টি</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">ক্রয়: {bnCurrency(s.purchaseCost)}</div>
            </div>

            {/* Live */}
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-center">
              <div className="text-xs text-muted-foreground mb-1 font-medium">বর্তমানে জীবিত</div>
              <div className="text-xl font-bold text-success">
                {bnNum(s.liveBirds)} <span className="text-xs font-normal text-muted-foreground">টি</span>
              </div>
              <div className="text-[10px] text-success/80 mt-0.5">
                অবশিষ্ট: {bnNum(s.remainingBirds)} টি
              </div>
            </div>

            {/* Mortality */}
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <div className="text-xs text-muted-foreground mb-1 font-medium">মোট মৃত্যু</div>
              <div className="text-xl font-bold text-destructive">
                {bnNum(s.totalMortality)} <span className="text-xs font-normal text-muted-foreground">টি</span>
              </div>
              <div className="text-[10px] font-medium text-destructive mt-0.5">
                হার: {bnNum(s.mortalityRate, 1)}% {s.targetMortalityPct ? `(টার্গেট ≤${bnNum(s.targetMortalityPct, 1)}%)` : ''}
              </div>
            </div>

            {/* Sold */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-center">
              <div className="text-xs text-muted-foreground mb-1 font-medium">বিক্রিত মুরগি</div>
              <div className="text-xl font-bold text-primary">
                {bnNum(s.soldBirds)} <span className="text-xs font-normal text-muted-foreground">টি</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {s.avgSaleWeightG ? `গড় বিক্রি: ${bnNum(s.avgSaleWeightG, 0)} গ্রাম` : 'বিক্রি রেকর্ড'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Growth & Weight Performance */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Scale className="w-4 h-4 text-primary" />
              <span>দৈহিক বৃদ্ধি ও ওজন (Growth & Weight Gain)</span>
            </CardTitle>
            {statusLabel && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusTone}`}>
                {statusLabel}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="bg-secondary/40 border border-border/50 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">সর্বশেষ গড় ওজন</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {s.latestAvgWeightG !== null ? `${bnNum(s.latestAvgWeightG, 0)} গ্রাম` : '—'}
              </p>
              {s.latestAvgWeightG !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ≈ {bnNum(gToKg(s.latestAvgWeightG), 2)} কেজি প্রতি মুরগি
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-background border border-border text-foreground">
                টার্গেট: {s.targetWeightG ? `${bnNum(s.targetWeightG, 0)} গ্রাম` : 'নির্ধারিত নেই'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-success">
                বৃদ্ধি: {s.weightGainG !== null ? `+${bnNum(s.weightGainG, 0)} গ্রাম` : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-[10px] text-muted-foreground">দৈনিক বৃদ্ধি (ADG)</div>
              <div className="font-bold text-foreground mt-0.5">
                {s.latestAdgG !== null ? `${bnNum(s.latestAdgG, 1)} গ্রাম/দিন` : '—'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-[10px] text-muted-foreground">বৃদ্ধি শতকরা</div>
              <div className="font-bold text-success mt-0.5">
                {s.weightGainPct !== null ? `+${bnNum(s.weightGainPct, 1)}%` : '—'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-muted-foreground">টার্গেট বিক্রির বয়স</div>
              <div className="font-bold text-foreground mt-0.5">
                {s.targetSaleAgeDays ? `${toBn(s.targetSaleAgeDays)} দিন` : '—'}
              </div>
            </div>
          </div>

          {/* Growth chart */}
          {growthData.length > 1 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-1 font-medium">ওজন বৃদ্ধির ধারা:</div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="g" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="বাস্তব গড় (গ্রাম)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    {s.targetWeightG && (
                      <Line
                        type="monotone"
                        dataKey="টার্গেট (গ্রাম)"
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. FEED & FCR */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Wheat className="w-4 h-4 text-primary" />
              <span>খাদ্য ও FCR পারফরম্যান্স</span>
            </CardTitle>
            <span className="text-xs font-semibold text-muted-foreground">
              মোট খাদ্য খরচ: <span className="text-foreground font-bold">{bnCurrency(s.feedCost)}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">মোট খাদ্য ক্রয়</div>
              <div className="text-base sm:text-lg font-bold text-foreground">
                {bnNum(s.totalFeedKg, 1)} <span className="text-xs font-normal text-muted-foreground">কেজি</span>
              </div>
              <div className="text-[10px] text-muted-foreground">({bnNum(s.totalBags)} বস্তা)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">ব্যবহৃত খাদ্য</div>
              <div className="text-base sm:text-lg font-bold text-foreground">
                {bnNum(s.feedConsumedKg, 1)} <span className="text-xs font-normal text-muted-foreground">কেজি</span>
              </div>
              <div className="text-[10px] text-muted-foreground">প্রতি: {bnNum(s.feedConsumedPerLiveBirdKg, 2)} কেজি</div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">অবশিষ্ট স্টক</div>
              <div className="text-base sm:text-lg font-bold text-foreground">
                {bnNum(s.remainingFeedKg, 1)} <span className="text-xs font-normal text-muted-foreground">কেজি</span>
              </div>
              <div className="text-[10px] text-muted-foreground">খরচ/মুরগি: {bnCurrency(s.feedCostPerBird)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">বর্তমান FCR:</span>
              <span className="font-extrabold text-sm text-primary">
                {s.fcr !== null ? bnNum(s.fcr, 2) : 'পর্যাপ্ত ডেটা নেই'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
              {s.targetFcr && (
                <span>টার্গেট FCR: <b className="text-foreground">{bnNum(s.targetFcr, 2)}</b></span>
              )}
              {s.fcrVsTarget !== null && (
                <span className={`font-semibold ${s.fcrVsTarget <= 0 ? 'text-success' : 'text-destructive'}`}>
                  ({s.fcrVsTarget <= 0 ? '' : '+'}{bnNum(s.fcrVsTarget, 2)})
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. HEALTH & COSTS */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span>স্বাস্থ্য, ওষুধ ও খামার ব্যয়</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">ওষুধ খরচ</div>
              <div className="text-base sm:text-lg font-bold text-foreground">{bnCurrency(s.medicineCost)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">স্বাস্থ্য সুরক্ষা</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">অন্যান্য খামার খরচ</div>
              <div className="text-base sm:text-lg font-bold text-foreground">{bnCurrency(s.otherExpenses)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">পরিচালন ব্যয়</div>
            </div>
          </div>

          {upcomingVaccine ? (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-foreground">আসন্ন টিকা: </span>
                <span className="font-bold text-primary">{upcomingVaccine.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-primary bg-primary/15 px-2.5 py-0.5 rounded-full border border-primary/20">
                {toBn(upcomingVaccine.plannedDate)} ({toBn(upcomingVaccine.recommendedAgeDays)} দিন)
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-secondary/30 text-center text-xs text-muted-foreground">
              কোনো পেন্ডিং টিকা নেই
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/40 text-[11px] text-muted-foreground text-center">
            বাচ্চা ক্রয়: {bnCurrency(s.purchaseCost)} • খাদ্য: {bnCurrency(s.feedCost)} • ওষুধ: {bnCurrency(s.medicineCost)}
            {expByCat.length > 0 && ` • অন্যান্য: ${expByCat.map((c) => `${c.label} ${bnCurrency(c.total)}`).join(' • ')}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
