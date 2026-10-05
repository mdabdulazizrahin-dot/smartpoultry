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
import { SonaliBatch, SONALI_EXPENSE_CATEGORIES } from '@/types/poultry';
import {
  getSonaliStats,
  bnCurrency,
  bnNum,
  toBn,
  sonaliWeightStatus,
  gToKg,
} from '@/lib/sonaliCalculations';

interface Props {
  batch: SonaliBatch;
}

export function SonaliDashboard({ batch }: Props) {
  const s = getSonaliStats(batch);

  const wStatus = sonaliWeightStatus(s);
  const statusLabel =
    wStatus === 'above'
      ? '✅ লক্ষ্যের উপরে বৃদ্ধি'
      : wStatus === 'on'
      ? '✅ লক্ষ্য অনুযায়ী চলছে'
      : wStatus === 'below'
      ? '⚠️ লক্ষ্যের নিচে ওজন'
      : '';
  const statusTone =
    wStatus === 'below'
      ? 'bg-destructive/10 text-destructive border border-destructive/20'
      : wStatus === 'none'
      ? ''
      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';

  // Chart data: Growth
  const growthData = s.weightHistory.map((r) => ({
    date: r.record.date.slice(5),
    'গড় ওজন (গ্রাম)': Math.round(r.avgG),
    'বৃদ্ধি (গ্রাম)': r.gainG !== null ? Math.round(r.gainG) : 0,
    ...(s.targetWeightG ? { 'লক্ষ্য ওজন (গ্রাম)': Math.round(s.targetWeightG) } : {}),
  }));

  // Chart data: Mortality
  let cumMortality = 0;
  const mortalityData = [...(batch.mortality || [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => {
      cumMortality += m.count;
      return { date: m.date.slice(5), 'মৃত্যু': m.count, 'ক্রমপুঞ্জিত মৃত্যু': cumMortality };
    });

  const mortalityReasonsData = s.mortalityByReason.map((r) => ({
    name: r.reason,
    'সংখ্যা': r.count,
  }));

  // Chart data: Feed
  const feedData = [...(batch.feed || [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((f) => ({
      date: f.date.slice(5),
      'খাদ্য (কেজি)': Number(f.totalKg.toFixed(1)),
      'খরচ (৳)': Math.round(f.totalCost),
    }));

  // Chart data: Financial breakdown
  const financeData = [
    { name: 'বাচ্চা ক্রয়', মান: Math.round(s.purchaseCost) },
    { name: 'খাদ্য খরচ', মান: Math.round(s.feedCost) },
    { name: 'ওষুধ খরচ', মান: Math.round(s.medicineCost) },
    { name: 'অন্যান্য খরচ', মান: Math.round(s.expenseCost) },
    { name: 'মোট বিক্রি আয়', মান: Math.round(s.totalSales) },
    { name: s.netProfit >= 0 ? 'নিট লাভ' : 'নিট ক্ষতি', মান: Math.round(Math.abs(s.netProfit)) },
  ];

  const upcomingVaccine = [...(batch.vaccines || [])]
    .filter((v) => v.status === 'pending')
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))[0];

  const expByCat = SONALI_EXPENSE_CATEGORIES.map((c) => ({
    label: c.label,
    total: (batch.expenses || []).filter((e) => e.category === c.id).reduce((sum, e) => sum + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="space-y-4">
      {/* 1. Main Hero Financial Summary (Layer Green Theme) */}
      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/20">
              🐣 {batch.name} • {batch.breed || 'সোনালি'}
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
              <span>ফ্লক ও বয়সের তথ্য</span>
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
                হার: {bnNum(s.mortalityRate, 1)}% {s.targetMortalityPct ? `(লক্ষ্য ≤${bnNum(s.targetMortalityPct, 1)}%)` : ''}
              </div>
            </div>

            {/* Sold */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 text-center">
              <div className="text-xs text-muted-foreground mb-1 font-medium">বিক্রিত মুরগি</div>
              <div className="text-xl font-bold text-primary">
                {bnNum(s.soldBirds)} <span className="text-xs font-normal text-muted-foreground">টি</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {s.avgSaleWeightG ? `গড়: ${bnNum(s.avgSaleWeightG, 0)} গ্রাম` : 'বিক্রি রেকর্ড'}
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
              <span>ওজন বৃদ্ধি ও পারফরম্যান্স (গ্রাম)</span>
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
              <p className="text-xs font-medium text-muted-foreground">বর্তমান গড় ওজন</p>
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
                লক্ষ্য: {s.targetWeightG ? `${bnNum(s.targetWeightG, 0)} গ্রাম` : 'নির্ধারিত নেই'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-success">
                বৃদ্ধি: {s.weightGainG !== null ? `+${bnNum(s.weightGainG, 0)} গ্রাম` : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-[10px] text-muted-foreground">দৈনিক বৃদ্ধি (ADG)</div>
              <div className="font-bold text-foreground mt-0.5">
                {s.latestAdgG !== null ? `${bnNum(s.latestAdgG, 1)} গ্রাম/দিন` : '—'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-[10px] text-muted-foreground">লক্ষ্যের তুলনায়</div>
              <div className={`font-bold mt-0.5 ${s.weightVsTargetG !== null && s.weightVsTargetG >= 0 ? 'text-success' : s.weightVsTargetG !== null ? 'text-destructive' : 'text-foreground'}`}>
                {s.weightVsTargetG !== null ? `${s.weightVsTargetG >= 0 ? '+' : '−'}${bnNum(Math.abs(s.weightVsTargetG), 0)} গ্রাম` : '—'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-[10px] text-muted-foreground">টার্গেট বিক্রির বয়স</div>
              <div className="font-bold text-foreground mt-0.5">
                {s.targetSaleAgeDays ? `${toBn(s.targetSaleAgeDays)} দিন` : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Feed & FCR Card */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Wheat className="w-4 h-4 text-primary" />
              <span>খাদ্য ও FCR হিসাব</span>
            </CardTitle>
            <span className="text-xs font-bold text-foreground">
              মোট খাদ্য খরচ: {bnCurrency(s.feedCost)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-center">
              <div className="text-xs text-muted-foreground mb-0.5 font-medium">মোট খাদ্য ক্রয়</div>
              <div className="text-base sm:text-lg font-bold text-foreground">
                {bnNum(s.totalFeedKg, 1)} <span className="text-xs font-normal text-muted-foreground">কেজি</span>
              </div>
              <div className="text-[10px] text-muted-foreground">({bnNum(s.totalBags)} বস্তা)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-center">
              <div className="text-xs text-muted-foreground mb-0.5 font-medium">ব্যবহৃত খাদ্য</div>
              <div className="text-base sm:text-lg font-bold text-foreground">
                {bnNum(s.feedConsumedKg, 1)} <span className="text-xs font-normal text-muted-foreground">কেজি</span>
              </div>
              <div className="text-[10px] text-muted-foreground">প্রতি মুরগি: {bnNum(s.feedConsumedPerLiveBirdKg, 2)} কেজি</div>
            </div>
            <div className="p-2.5 rounded-xl bg-success/10 border border-success/20 text-center">
              <div className="text-xs text-muted-foreground mb-0.5 font-medium">অবশিষ্ট স্টক</div>
              <div className="text-base sm:text-lg font-bold text-success">
                {bnNum(s.remainingFeedKg, 1)} <span className="text-xs font-normal text-muted-foreground">কেজি</span>
              </div>
              <div className="text-[10px] text-muted-foreground">খরচ/মুরগি: {bnCurrency(s.feedCostPerBird)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">বর্তমান FCR:</span>
              <span className="font-extrabold text-sm text-primary">
                {s.fcr !== null ? bnNum(s.fcr, 2) : 'পর্যাপ্ত ডেটা নেই'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              {s.targetFcr && (
                <span>লক্ষ্য FCR: <b>{bnNum(s.targetFcr, 2)}</b></span>
              )}
              {s.fcrVsTarget !== null && (
                <span className={`font-semibold ${s.fcrVsTarget <= 0 ? 'text-success' : 'text-destructive'}`}>
                  পার্থক্য: {s.fcrVsTarget <= 0 ? '' : '+'}{bnNum(s.fcrVsTarget, 2)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Health & Costs */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span>স্বাস্থ্য ও রোগ নিয়ন্ত্রণ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="text-xs text-muted-foreground mb-0.5 font-medium">ওষুধ খরচ</div>
              <div className="text-lg font-bold text-destructive">{bnCurrency(s.medicineCost)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">রেকর্ড: {bnNum((batch.medicines || []).length)} টি</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
              <div className="text-xs text-muted-foreground mb-0.5 font-medium">অন্যান্য খরচ</div>
              <div className="text-lg font-bold text-foreground">{bnCurrency(s.expenseCost)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {s.mortalityByReason.length > 0 ? `কারণ: ${s.mortalityByReason[0].reason}` : 'খামার পরিচালনা'}
              </div>
            </div>
          </div>

          {upcomingVaccine ? (
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs flex justify-between items-center">
              <div>
                <span className="text-muted-foreground">আসন্ন ভ্যাকসিন: </span>
                <span className="font-bold text-primary">{upcomingVaccine.name}</span>
              </div>
              <span className="text-xs font-medium text-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                {toBn(upcomingVaccine.plannedDate)} ({toBn(upcomingVaccine.recommendedAgeDays)} দিন)
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-secondary/30 text-center text-xs text-muted-foreground">
              কোনো পেন্ডিং ভ্যাকসিন নেই
            </div>
          )}

          {expByCat.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border/40">
              খাতভিত্তিক খরচ: {expByCat.map((c) => `${c.label} ${bnCurrency(c.total)}`).join(' • ')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 1: Growth & Target */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">⚖️ ওজন বৃদ্ধি ও লক্ষ্যমাত্রা গ্রাফ</CardTitle>
        </CardHeader>
        <CardContent>
          {growthData.length > 1 ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="গড় ওজন (গ্রাম)" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="বৃদ্ধি (গ্রাম)" stroke="hsl(var(--success))" strokeWidth={1.5} dot={{ r: 2 }} />
                  {s.targetWeightG && (
                    <Line type="monotone" dataKey="লক্ষ্য ওজন (গ্রাম)" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              বৃদ্ধি গ্রাফ দেখতে অন্তত ২টি ওজন রেকর্ড এন্ট্রি করুন
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Mortality Trend & Reasons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">💀 মৃত্যুর ধারা ও কারণভিত্তিক বিশ্লেষণ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mortalityData.length > 0 ? (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mortalityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="মৃত্যু" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ক্রমপুঞ্জিত মৃত্যু" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {mortalityReasonsData.length > 0 && (
                <div className="h-40 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mortalityReasonsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="সংখ্যা" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">এখনও কোনো মৃত্যু রেকর্ড নেই</p>
          )}
        </CardContent>
      </Card>

      {/* Chart 3: Feed Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">🌾 খাদ্য ব্যবহার ও ক্রয় গ্রাফ</CardTitle>
        </CardHeader>
        <CardContent>
          {feedData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="খাদ্য (কেজি)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="খরচ (৳)" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">কোনো খাদ্য রেকর্ড নেই</p>
          )}
        </CardContent>
      </Card>

      {/* Chart 4: Sales vs Expenses / Profit & Loss */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">💵 আয় ও ব্যয় বিশ্লেষণ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="মান" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
