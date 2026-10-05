import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { BroilerBatch, BROILER_EXPENSE_CATEGORIES, BROILER_BREEDS } from '@/types/poultry';
import { getBroilerStats } from '@/lib/broilerCalculations';

interface Props {
  batch: BroilerBatch;
}

const money = (n: number) => `${Math.round(n).toLocaleString('en-US')} BDT`;
const catLabel = (id: string) => BROILER_EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || id;

const download = (content: string, filename: string, mime: string) => {
  const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export function BroilerReport({ batch }: Props) {
  const [busy, setBusy] = useState(false);
  const s = getBroilerStats(batch);
  const breedLabel = BROILER_BREEDS.find((b) => b.id === batch.breed)?.label || batch.breed || 'ব্রয়লার';

  const buildSheet = (): any[][] => {
    const rows: any[][] = [];

    rows.push(['Smart Poultry - Broiler Management Report']);
    rows.push(['Batch Name', batch.name]);
    rows.push(['Strain / Breed', breedLabel]);
    rows.push(['Arrival Date', batch.arrivalDate]);
    rows.push(['Age (Days)', s.ageDays]);
    rows.push(['Age (Weeks)', `${s.ageWeeks}w ${s.ageRemainingDays}d`]);
    rows.push(['Supplier', batch.supplier || 'N/A']);
    rows.push(['Generated At', new Date().toLocaleString()]);
    rows.push([]);

    rows.push(['Flock Summary']);
    rows.push(['Metric', 'Value']);
    rows.push(['Initial Birds', batch.initialCount]);
    rows.push(['Total Mortality', s.totalMortality]);
    rows.push(['Mortality Rate (%)', s.mortalityRate.toFixed(2) + '%']);
    rows.push(['Target Mortality (%)', s.targetMortalityPct ? s.targetMortalityPct + '%' : 'N/A']);
    rows.push(['Sold Birds', s.soldBirds]);
    rows.push(['Current Live Birds', s.liveBirds]);
    rows.push([]);

    rows.push(['Growth & Weight Performance']);
    rows.push(['Latest Avg Body Weight (g)', s.latestAvgWeightG !== null ? Math.round(s.latestAvgWeightG) : 'N/A']);
    rows.push(['Target Sale Weight (g)', s.targetWeightG ? Math.round(s.targetWeightG) : 'N/A']);
    rows.push(['Target Sale Age (Days)', s.targetSaleAgeDays ?? 'N/A']);
    rows.push(['Latest Weight Gain (g)', s.weightGainG !== null ? Math.round(s.weightGainG) : 'N/A']);
    rows.push(['Latest ADG (g/day)', s.latestAdgG !== null ? s.latestAdgG.toFixed(1) : 'N/A']);
    rows.push([]);

    rows.push(['Feed & FCR Performance']);
    rows.push(['Total Feed Purchased (kg)', s.totalFeedKg]);
    rows.push(['Total Feed Purchased (Bags)', s.totalBags]);
    rows.push(['Total Feed Consumed (kg)', s.feedConsumedKg]);
    rows.push(['Remaining Feed Stock (kg)', s.remainingFeedKg]);
    rows.push(['Total Feed Cost (BDT)', Math.round(s.feedCost)]);
    rows.push(['Feed Consumed per Bird (kg)', s.feedConsumedPerLiveBirdKg.toFixed(2)]);
    rows.push(['Feed Consumed per Bird (g)', Math.round(s.feedConsumedPerLiveBirdG)]);
    rows.push(['FCR (Actual)', s.fcr !== null ? s.fcr.toFixed(2) : 'Insufficient Data']);
    rows.push(['FCR (Target)', s.targetFcr ?? 'N/A']);
    rows.push([]);

    rows.push(['Weight Records History']);
    rows.push(['Date', 'Sample Birds', 'Avg Weight (g)', 'Gain (g)', 'Gain (%)', 'ADG (g/day)', 'Target (g)']);
    s.weightHistory.forEach((r) =>
      rows.push([
        r.record.date,
        r.record.sampleBirds,
        Math.round(r.avgG),
        r.gainG !== null ? Math.round(r.gainG) : '',
        r.gainPct !== null ? r.gainPct.toFixed(1) + '%' : '',
        r.adgG !== null ? r.adgG.toFixed(1) : '',
        r.targetG ? Math.round(r.targetG) : '',
      ])
    );
    rows.push([]);

    rows.push(['Mortality Records']);
    rows.push(['Date', 'Count', 'Reason', 'Notes']);
    (batch.mortality || []).forEach((m) =>
      rows.push([m.date, m.count, m.reason || '', m.notes || ''])
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

  const toCsv = (rows: any[][]) =>
    rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? '');
            return s.includes(',') || s.includes('"') || s.includes('\n')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(',')
      )
      .join('\n');

  const exportCsv = () => {
    download(toCsv(buildSheet()), `${batch.name}-broiler-report.csv`, 'text/csv');
    toast.success('CSV ডাউনলোড হয়েছে');
  };

  // Modern .xlsx export using SheetJS xlsx library
  const exportExcelXlsx = () => {
    try {
      const rows = buildSheet();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Broiler Report');
      XLSX.writeFile(wb, `${batch.name}-broiler-report.xlsx`);
      toast.success('আধুনিক Excel (.xlsx) ফাইল ডাউনলোড হয়েছে');
    } catch (e) {
      console.error(e);
      toast.error('Excel ফাইল তৈরিতে সমস্যা হয়েছে');
    }
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

      line('Broiler Poultry Batch Report', 16, true);
      line(`Batch: ${batch.name} | Breed: ${breedLabel} | Age: ${s.ageDays} days (${s.ageWeeks}w ${s.ageRemainingDays}d)`);
      line(`Arrival: ${batch.arrivalDate} | Supplier: ${batch.supplier || 'N/A'}`);
      y += 2;

      line('1. Flock & Mortality', 12, true);
      line(`Initial Birds: ${batch.initialCount} | Current Live Birds: ${s.liveBirds} | Sold: ${s.soldBirds}`);
      line(`Total Mortality: ${s.totalMortality} (${s.mortalityRate.toFixed(1)}%) | Target Mortality: ${s.targetMortalityPct ?? '-'}%`);
      y += 2;

      line('2. Feed & Feed Performance', 12, true);
      line(`Purchased: ${s.totalFeedKg.toFixed(1)} kg (${s.totalBags} bags) | Consumed: ${s.feedConsumedKg.toFixed(1)} kg | Stock: ${s.remainingFeedKg.toFixed(1)} kg`);
      line(`Total Feed Cost: ${money(s.feedCost)} | Feed/Bird: ${s.feedConsumedPerLiveBirdKg.toFixed(2)} kg (${Math.round(s.feedConsumedPerLiveBirdG)} g)`);
      y += 2;

      line('3. Growth, ADG & FCR Performance', 12, true);
      line(`Latest Avg Body Weight: ${s.latestAvgWeightG !== null ? Math.round(s.latestAvgWeightG) + ' g' : '-'} | Target: ${s.targetWeightG ? Math.round(s.targetWeightG) + ' g' : '-'}`);
      line(`Latest Gain: ${s.weightGainG !== null ? Math.round(s.weightGainG) + ' g' : '-'} | ADG: ${s.latestAdgG !== null ? s.latestAdgG.toFixed(1) + ' g/day' : '-'}`);
      line(`FCR: ${s.fcr !== null ? s.fcr.toFixed(2) : 'Insufficient Data'} | Target FCR: ${s.targetFcr ?? '-'}`);
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
      BROILER_EXPENSE_CATEGORIES.forEach((c) => {
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

      doc.save(`${batch.name}-broiler-report.pdf`);
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
          <FileText className="w-4 h-4 text-primary" /> ব্রয়লার ব্যাচ রিপোর্ট ও এক্সপোর্ট
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          এই ব্রয়লার ব্যাচের সম্পূর্ণ হিসাব — ফ্লক, বৃদ্ধি, খাদ্য, ওজন, FCR, ভ্যাকসিন, ওষুধ, খরচ, বিক্রি ও লাভ-ক্ষতির বিবরণী ডাউনলোড করুন।
        </p>
        <Button className="w-full gap-2" onClick={exportPdf} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          PDF রিপোর্ট ডাউনলোড করুন
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={exportExcelXlsx}>
            <FileSpreadsheet className="w-4 h-4 text-success" /> Excel (.xlsx)
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <FileSpreadsheet className="w-4 h-4 text-primary" /> CSV (.csv)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
