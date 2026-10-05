import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { SonaliBatch, SONALI_EXPENSE_CATEGORIES } from '@/types/poultry';
import { getSonaliStats } from '@/lib/sonaliCalculations';

interface Props {
  batch: SonaliBatch;
}

const money = (n: number) => `${Math.round(n).toLocaleString('en-US')} BDT`;
const catLabel = (id: string) => SONALI_EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || id;

const download = (content: string, filename: string, mime: string) => {
  const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const csvEscape = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows: (string | number)[][]) => rows.map((r) => r.map(csvEscape).join(',')).join('\n');

export function SonaliReport({ batch }: Props) {
  const [busy, setBusy] = useState(false);
  const s = getSonaliStats(batch);

  const buildSheet = () => {
    const rows: (string | number)[][] = [];
    rows.push(['Sonali / Munali Poultry Batch Report']);
    rows.push(['Batch Name', batch.name]);
    rows.push(['Breed / Type', batch.breed || 'Sonali']);
    rows.push(['Arrival Date', batch.arrivalDate]);
    rows.push(['Purchase Date', batch.purchaseDate || batch.arrivalDate]);
    rows.push(['Supplier', batch.supplier || '-']);
    rows.push(['Initial Birds', batch.initialCount]);
    rows.push(['Price per Bird', batch.pricePerBird ?? '-']);
    rows.push(['Total Chick Cost', Math.round(s.purchaseCost)]);
    rows.push([]);

    rows.push(['Flock & Mortality Summary']);
    rows.push(['Age (days)', s.ageDays]);
    rows.push(['Age (weeks + days)', `${s.ageWeeks} weeks ${s.ageRemainingDays} days`]);
    rows.push(['Total Mortality', s.totalMortality]);
    rows.push(['Mortality Rate %', s.mortalityRate.toFixed(2)]);
    rows.push(['Birds Sold', s.soldBirds]);
    rows.push(['Current Live / Remaining Birds', s.liveBirds]);
    rows.push([]);

    rows.push(['Mortality Records']);
    rows.push(['Date', 'Count', 'Reason', 'Notes']);
    (batch.mortality || []).forEach((m) => rows.push([m.date, m.count, m.reason || '', m.notes || '']));
    rows.push([]);

    rows.push(['Feed Management']);
    rows.push(['Date', 'Type', 'Bags', 'Bag Size (kg)', 'Total kg', 'Price/Bag', 'Total Cost']);
    (batch.feed || []).forEach((f) =>
      rows.push([f.date, f.feedType || '', f.bags, f.bagSizeKg, f.totalKg, f.pricePerBag, Math.round(f.totalCost)])
    );
    rows.push(['Feed Received (kg)', s.totalFeedKg]);
    rows.push(['Feed Consumed (kg)', s.feedConsumedKg]);
    rows.push(['Feed Stock Remaining (kg)', s.remainingFeedKg]);
    rows.push(['Total Feed Cost', Math.round(s.feedCost)]);
    rows.push(['Feed Cost Per Bird', Math.round(s.feedCostPerBird)]);
    rows.push([]);

    rows.push(['Weight & Growth History (Grams)']);
    rows.push(['Date', 'Sample Birds', 'Total (g)', 'Avg Weight (g)', 'Gain (g)', 'Gain %', 'ADG (g/day)', 'Target (g)']);
    s.weightHistory.forEach((r) =>
      rows.push([
        r.record.date,
        r.record.sampleBirds,
        Math.round(r.totalG),
        Math.round(r.avgG),
        r.gainG !== null ? Math.round(r.gainG) : '',
        r.gainPct !== null ? r.gainPct.toFixed(1) : '',
        r.adgG !== null ? r.adgG.toFixed(1) : '',
        r.targetG ?? '',
      ])
    );
    rows.push(['Latest Average Weight (g)', s.latestAvgWeightG !== null ? Math.round(s.latestAvgWeightG) : '-']);
    rows.push(['FCR', s.fcr !== null ? s.fcr.toFixed(2) : 'Insufficient Data']);
    rows.push(['Target FCR', s.targetFcr ?? '-']);
    rows.push([]);

    rows.push(['Vaccination Schedule']);
    rows.push(['Name', 'Recommended Age (days)', 'Planned Date', 'Status', 'Completed Date']);
    (batch.vaccines || []).forEach((v) =>
      rows.push([v.name, v.recommendedAgeDays, v.plannedDate, v.status, v.completedDate || ''])
    );
    rows.push([]);

    rows.push(['Medicines & Health']);
    rows.push(['Date', 'Disease / Problem', 'Medicine', 'Amount (BDT)', 'Notes']);
    (batch.medicines || []).forEach((m) =>
      rows.push([m.date, m.problem || '', m.medicineName, m.amount, m.notes || ''])
    );
    rows.push(['Total Medicine Cost', Math.round(s.medicineCost)]);
    rows.push([]);

    rows.push(['Operating Expenses']);
    rows.push(['Date', 'Category', 'Description', 'Amount (BDT)']);
    (batch.expenses || []).forEach((e) =>
      rows.push([e.date, catLabel(e.category), e.description || '', e.amount])
    );
    rows.push(['Total Operating Expenses', Math.round(s.expenseCost)]);
    rows.push([]);

    rows.push(['Sales Records']);
    rows.push(['Date', 'Birds', 'Total Weight (kg)', 'Price/kg', 'Total Amount', 'Buyer', 'Notes']);
    (batch.sales || []).forEach((x) =>
      rows.push([x.date, x.birds, x.totalWeightKg, x.pricePerKg, Math.round(x.totalAmount), x.buyer || '', x.notes || ''])
    );
    rows.push(['Total Birds Sold', s.soldBirds]);
    rows.push(['Total Sold Live Weight (kg)', s.totalSoldWeightKg]);
    rows.push(['Total Sales Revenue', Math.round(s.totalSales)]);
    rows.push([]);

    rows.push(['Profit & Loss Statement']);
    rows.push(['Chick Purchase Cost', Math.round(s.purchaseCost)]);
    rows.push(['Feed Cost', Math.round(s.feedCost)]);
    rows.push(['Medicine Cost', Math.round(s.medicineCost)]);
    rows.push(['Operating Expenses', Math.round(s.expenseCost)]);
    rows.push(['Total Batch Cost', Math.round(s.totalCost)]);
    rows.push(['Total Sales Revenue', Math.round(s.totalSales)]);
    rows.push(['Net Profit / Loss', Math.round(s.netProfit)]);
    rows.push(['Production Cost per Bird', Math.round(s.costPerBird)]);
    if (s.costPerKg !== null) rows.push(['Production Cost per kg', Math.round(s.costPerKg)]);
    if (s.profitPerBird !== null) rows.push(['Net Profit per Bird', Math.round(s.profitPerBird)]);
    if (s.profitPerKg !== null) rows.push(['Net Profit per kg', Math.round(s.profitPerKg)]);

    return rows;
  };

  const exportCsv = () => {
    download(toCsv(buildSheet()), `${batch.name}-sonali-report.csv`, 'text/csv');
    toast.success('CSV ডাউনলোড হয়েছে');
  };

  const exportExcel = () => {
    const rows = buildSheet();
    const html = `<html><head><meta charset="utf-8" /></head><body><table>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${String(c ?? '')}</td>`).join('')}</tr>`)
      .join('')}</table></body></html>`;
    download(html, `${batch.name}-sonali-report.xls`, 'application/vnd.ms-excel');
    toast.success('Excel ডাউনলোড হয়েছে');
  };

  const exportPdf = async () => {
    setBusy(true);
    try {
      const doc = new jsPDF();
      let y = 18;
      const line = (text: string, size = 10, bold = false) => {
        if (y > 275) {
          doc.addPage();
          y = 18;
        }
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(text, 14, y);
        y += size > 12 ? 8 : 6;
      };

      line('Sonali / Munali Poultry Batch Report', 16, true);
      line(`Batch: ${batch.name} (${batch.breed || 'Sonali'})`, 11, true);
      line(`Arrival: ${batch.arrivalDate} | Age: ${s.ageDays} days (${s.ageWeeks} wks ${s.ageRemainingDays} d)`);
      line(`Supplier: ${batch.supplier || '-'} | Initial Count: ${batch.initialCount}`);
      y += 2;

      line('1. Bird & Mortality Summary', 12, true);
      line(`Initial Birds: ${batch.initialCount} | Live: ${s.liveBirds} | Sold: ${s.soldBirds}`);
      line(`Total Mortality: ${s.totalMortality} (${s.mortalityRate.toFixed(1)}%) | Target Mortality: ${s.targetMortalityPct ? s.targetMortalityPct + '%' : '-'}`);
      s.mortalityByReason.forEach((r) => line(`  - ${r.reason}: ${r.count} birds`));
      y += 2;

      line('2. Feed Management', 12, true);
      line(`Received: ${s.totalFeedKg.toFixed(1)} kg (${s.totalBags} bags) | Consumed: ${s.feedConsumedKg.toFixed(1)} kg`);
      line(`Remaining Stock: ${s.remainingFeedKg.toFixed(1)} kg | Feed Cost: ${money(s.feedCost)}`);
      line(`Feed/Bird: ${(s.feedConsumedPerLiveBirdKg).toFixed(2)} kg (${Math.round(s.feedConsumedPerLiveBirdG)} g) | Feed Cost/Bird: ${money(s.feedCostPerBird)}`);
      y += 2;

      line('3. Weight, Growth & FCR (Grams)', 12, true);
      line(`Current Avg Weight: ${s.latestAvgWeightG !== null ? Math.round(s.latestAvgWeightG) + ' g' : '-'} | Target: ${s.targetWeightG ? s.targetWeightG + ' g' : '-'}`);
      line(`Latest Gain: ${s.weightGainG !== null ? Math.round(s.weightGainG) + ' g' : '-'} | ADG: ${s.latestAdgG !== null ? s.latestAdgG.toFixed(1) + ' g/day' : '-'}`);
      line(`FCR: ${s.fcr !== null ? s.fcr.toFixed(2) : 'Insufficient Data (Need feed + weight record)'} | Target FCR: ${s.targetFcr ?? '-'}`);
      s.weightHistory.slice(-8).forEach((r) =>
        line(`  ${r.record.date}: sample ${r.record.sampleBirds} | avg ${Math.round(r.avgG)} g | gain ${r.gainG !== null ? Math.round(r.gainG) + ' g' : '-'} | adg ${r.adgG !== null ? r.adgG.toFixed(1) + ' g/d' : '-'}`)
      );
      y += 2;

      line('4. Vaccines & Health', 12, true);
      (batch.vaccines || []).slice(0, 10).forEach((v) => line(`  [${v.status}] ${v.name} (Day ${v.recommendedAgeDays}) - ${v.plannedDate}`));
      (batch.medicines || []).slice(0, 8).forEach((m) => line(`  ${m.date}: ${m.medicineName} (${m.problem || 'Treatment'}) = ${money(m.amount)}`));
      line(`Total Medicine Cost: ${money(s.medicineCost)}`);
      y += 2;

      line('5. Expenses Breakdown', 12, true);
      SONALI_EXPENSE_CATEGORIES.forEach((c) => {
        const total = (batch.expenses || []).filter((e) => e.category === c.id).reduce((sum, e) => sum + e.amount, 0);
        if (total > 0) line(`  - ${c.label}: ${money(total)}`);
      });
      line(`Total Operating Expenses: ${money(s.expenseCost)}`);
      y += 2;

      line('6. Sales Records', 12, true);
      (batch.sales || []).slice(0, 10).forEach((x) =>
        line(`  ${x.date}: ${x.birds} birds | ${x.totalWeightKg} kg @ ${money(x.pricePerKg)}/kg = ${money(x.totalAmount)} (${x.buyer || 'Buyer'})`)
      );
      line(`Total Sales: ${money(s.totalSales)} (Total Weight: ${s.totalSoldWeightKg.toFixed(1)} kg)`);
      y += 2;

      line('7. Profit & Loss Statement', 12, true);
      line(`Chick Purchase: ${money(s.purchaseCost)} | Feed Cost: ${money(s.feedCost)}`);
      line(`Medicine: ${money(s.medicineCost)} | Operating: ${money(s.expenseCost)}`);
      line(`TOTAL BATCH INVESTMENT / COST: ${money(s.totalCost)}`, 10, true);
      line(`TOTAL SALES REVENUE: ${money(s.totalSales)}`, 10, true);
      line(`${s.netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}: ${money(Math.abs(s.netProfit))}`, 11, true);
      line(`Cost per Bird: ${money(s.costPerBird)} | Profit per Bird: ${s.profitPerBird !== null ? money(s.profitPerBird) : '-'}`);

      doc.save(`${batch.name}-sonali-report.pdf`);
      toast.success('PDF রিপোর্ট ডাউনলোড হয়েছে');
    } catch (e) {
      console.error(e);
      toast.error('PDF তৈরি করা সম্ভব হয়নি');
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-primary" /> সম্পূর্ণ ব্যাচ রিপোর্ট ও এক্সপোর্ট
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          এই সোনালি/মুনালি ব্যাচের সম্পূর্ণ হিসাব — ফ্লক, বৃদ্ধি, খাদ্য, ওজন, FCR, ভ্যাকসিন, ওষুধ, খরচ, বিক্রি ও লাভ-ক্ষতির বিবরণী ডাউনলোড করুন।
        </p>
        <Button className="w-full gap-2" onClick={exportPdf} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          PDF রিপোর্ট ডাউনলোড করুন
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4" /> Excel (.xls)
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <FileSpreadsheet className="w-4 h-4" /> CSV (.csv)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
