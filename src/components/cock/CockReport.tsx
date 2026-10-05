import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { CockBatch, COCK_EXPENSE_CATEGORIES } from '@/types/poultry';
import { getCockStats } from '@/lib/cockCalculations';

interface Props {
  batch: CockBatch;
}

const money = (n: number) => `${Math.round(n).toLocaleString('en-US')} BDT`;
const catLabel = (id: string) => COCK_EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || id;

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

export function CockReport({ batch }: Props) {
  const [busy, setBusy] = useState(false);
  const s = getCockStats(batch);

  const buildSheet = () => {
    const rows: (string | number)[][] = [];
    rows.push(['Batch Information']);
    rows.push(['Name', batch.name]);
    rows.push(['Arrival / Purchase Date', batch.arrivalDate]);
    rows.push(['Supplier', batch.supplier || '-']);
    rows.push(['Breed', batch.breed || '-']);
    rows.push(['Initial Birds', batch.initialCount]);
    rows.push(['Price per Bird', batch.pricePerBird ?? '-']);
    rows.push(['Total Purchase Cost', Math.round(s.purchaseCost)]);
    rows.push([]);
    rows.push(['Bird Summary']);
    rows.push(['Age (days)', s.ageDays]);
    rows.push(['Total Mortality', s.totalMortality]);
    rows.push(['Mortality %', s.mortalityRate.toFixed(2)]);
    rows.push(['Birds Sold', s.soldBirds]);
    rows.push(['Live / Remaining Birds', s.liveBirds]);
    rows.push([]);
    rows.push(['Mortality Records']);
    rows.push(['Date', 'Count', 'Reason', 'Note']);
    batch.mortality.forEach((m) => rows.push([m.date, m.count, m.reason || '', m.notes || '']));
    rows.push(['Mortality by Reason']);
    s.mortalityByReason.forEach((r) => rows.push([r.reason, r.count]));
    rows.push([]);
    rows.push(['Feed Purchases']);
    rows.push(['Date', 'Type', 'Bags', 'Bag Size (kg)', 'Total kg', 'Price/Bag', 'Total Cost']);
    batch.feed.forEach((f) =>
      rows.push([f.date, f.feedType || '', f.bags, f.bagSizeKg, f.totalKg, f.pricePerBag, Math.round(f.totalCost)])
    );
    rows.push(['Feed Consumption']);
    rows.push(['Date', 'Type', 'Quantity (kg)', 'Note']);
    (batch.feedConsumption || []).forEach((f) => rows.push([f.date, f.feedType || '', f.quantityKg, f.notes || '']));
    rows.push(['Feed Received (kg)', s.totalFeedKg]);
    rows.push(['Feed Consumed (kg)', s.feedConsumedKg]);
    rows.push(['Feed Remaining (kg)', s.remainingFeedKg]);
    rows.push(['Feed Cost', Math.round(s.feedCost)]);
    rows.push([]);
    rows.push(['Weight / Growth (grams)']);
    rows.push(['Date', 'Sample Birds', 'Total (g)', 'Avg (g)', 'Prev Avg (g)', 'Gain (g)', 'Gain %', 'Target (g)', 'Vs Target (g)']);
    s.weightHistory.forEach((r) =>
      rows.push([
        r.record.date, r.record.sampleBirds, Math.round(r.totalG), Math.round(r.avgG),
        r.prevAvgG !== null ? Math.round(r.prevAvgG) : '', r.gainG !== null ? Math.round(r.gainG) : '',
        r.gainPct !== null ? r.gainPct.toFixed(1) : '', r.targetG ?? '', r.vsTargetG !== null ? Math.round(r.vsTargetG) : '',
      ])
    );
    rows.push(['FCR', s.fcr !== null ? s.fcr.toFixed(2) : '-']);
    rows.push(['Target FCR', s.targetFcr ?? '-']);
    rows.push([]);
    rows.push(['Vaccines']);
    rows.push(['Name', 'Age (days)', 'Planned Date', 'Status', 'Completed Date']);
    (batch.vaccines || []).forEach((v) =>
      rows.push([v.name, v.recommendedAgeDays, v.plannedDate, v.status, v.completedDate || ''])
    );
    rows.push([]);
    rows.push(['Medicine']);
    rows.push(['Date', 'Problem', 'Medicine', 'Amount', 'Note']);
    (batch.medicines || []).forEach((m) => rows.push([m.date, m.problem || '', m.medicineName, m.amount, m.notes || '']));
    rows.push([]);
    rows.push(['Expenses']);
    rows.push(['Date', 'Category', 'Description', 'Amount']);
    (batch.expenses || []).forEach((e) => rows.push([e.date, catLabel(e.category), e.description || '', e.amount]));
    rows.push([]);
    rows.push(['Sales']);
    rows.push(['Date', 'Birds', 'Total Weight (kg)', 'Price/kg', 'Total Amount', 'Buyer', 'Note']);
    (batch.sales || []).forEach((x) =>
      rows.push([x.date, x.birds, x.totalWeightKg, x.pricePerKg, Math.round(x.totalAmount), x.buyer || '', x.notes || ''])
    );
    rows.push([]);
    rows.push(['Profit & Loss']);
    rows.push(['Chick Purchase Cost', Math.round(s.purchaseCost)]);
    rows.push(['Feed Cost', Math.round(s.feedCost)]);
    rows.push(['Medicine Cost', Math.round(s.medicineCost)]);
    COCK_EXPENSE_CATEGORIES.forEach((c) => {
      const t = (batch.expenses || []).filter((e) => e.category === c.id).reduce((a, e) => a + e.amount, 0);
      if (t > 0) rows.push([`${c.label} (expense)`, Math.round(t)]);
    });
    rows.push(['Total Cost', Math.round(s.totalCost)]);
    rows.push(['Total Sales', Math.round(s.totalSales)]);
    rows.push([s.netProfit >= 0 ? 'Net Profit' : 'Net Loss', Math.round(Math.abs(s.netProfit))]);
    return rows;
  };

  const exportCsv = () => {
    download(toCsv(buildSheet()), `${batch.name}-report.csv`, 'text/csv');
    toast.success('CSV ডাউনলোড হয়েছে');
  };

  const exportExcel = () => {
    const rows = buildSheet();
    const html = `<html><head><meta charset="utf-8" /></head><body><table>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${String(c ?? '')}</td>`).join('')}</tr>`)
      .join('')}</table></body></html>`;
    download(html, `${batch.name}-report.xls`, 'application/vnd.ms-excel');
    toast.success('Excel ডাউনলোড হয়েছে');
  };

  const exportPdf = async () => {
    setBusy(true);
    try {
      const doc = new jsPDF();
      let y = 18;
      const line = (text: string, size = 10, bold = false) => {
        if (y > 280) { doc.addPage(); y = 18; }
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(text, 14, y);
        y += size > 12 ? 9 : 6;
      };

      line('Meat Poultry Batch Report', 16, true);
      line(`Batch: ${batch.name}`, 11, true);
      line(`Arrival: ${batch.arrivalDate} | Age: ${s.ageDays} days (${s.ageWeeks} weeks)`);
      line(`Supplier: ${batch.supplier || '-'} | Breed: ${batch.breed || '-'}`);
      y += 3;

      line('Bird Summary', 12, true);
      line(`Initial: ${batch.initialCount} | Mortality: ${s.totalMortality} (${s.mortalityRate.toFixed(2)}%)`);
      line(`Sold: ${s.soldBirds} | Live/Remaining: ${s.liveBirds}`);
      s.mortalityByReason.forEach((r) => line(`  - ${r.reason}: ${r.count}`));
      y += 3;

      line('Feed', 12, true);
      line(`Received: ${s.totalFeedKg.toFixed(1)} kg | Consumed: ${s.feedConsumedKg.toFixed(1)} kg | Remaining: ${s.remainingFeedKg.toFixed(1)} kg`);
      line(`Feed cost: ${money(s.feedCost)} | Avg daily: ${s.avgDailyFeedKg.toFixed(2)} kg`);
      y += 3;

      line('Weight / Growth (grams)', 12, true);
      line(`Current avg: ${s.latestAvgWeightG !== null ? Math.round(s.latestAvgWeightG) + ' g' : '-'} | Target: ${s.targetWeightG ? s.targetWeightG + ' g' : '-'}`);
      line(`Gain: ${s.weightGainG !== null ? Math.round(s.weightGainG) + ' g' : '-'} | Gain %: ${s.weightGainPct !== null ? s.weightGainPct.toFixed(1) + '%' : '-'}`);
      line(`FCR: ${s.fcr !== null ? s.fcr.toFixed(2) : '-'} | Target FCR: ${s.targetFcr ?? '-'}`);
      s.weightHistory.slice(-10).forEach((r) =>
        line(`  ${r.record.date}  sample ${r.record.sampleBirds}  avg ${Math.round(r.avgG)} g  gain ${r.gainG !== null ? Math.round(r.gainG) : '-'} g`)
      );
      y += 3;

      line('Vaccine', 12, true);
      (batch.vaccines || []).slice(0, 15).forEach((v) => line(`  ${v.plannedDate}  ${v.name}  [${v.status}]`));
      if (!(batch.vaccines || []).length) line('  none');
      y += 3;

      line('Medicine', 12, true);
      (batch.medicines || []).slice(0, 15).forEach((m) => line(`  ${m.date}  ${m.medicineName}  ${money(m.amount)}`));
      if (!(batch.medicines || []).length) line('  none');
      y += 3;

      line('Expenses', 12, true);
      COCK_EXPENSE_CATEGORIES.forEach((c) => {
        const t = (batch.expenses || []).filter((e) => e.category === c.id).reduce((a, e) => a + e.amount, 0);
        if (t > 0) line(`  ${c.id}: ${money(t)}`);
      });
      line(`  Total other expenses: ${money(s.expenseCost)}`);
      y += 3;

      line('Sales', 12, true);
      (batch.sales || []).slice(0, 20).forEach((x) =>
        line(`  ${x.date}  ${x.birds} birds  ${x.totalWeightKg} kg  ${money(x.pricePerKg)}/kg  = ${money(x.totalAmount)}`)
      );
      if (!(batch.sales || []).length) line('  none');
      y += 3;

      line('Profit & Loss', 12, true);
      line(`Chick purchase: ${money(s.purchaseCost)}`);
      line(`Feed: ${money(s.feedCost)} | Medicine: ${money(s.medicineCost)} | Other: ${money(s.expenseCost)}`);
      line(`Total cost: ${money(s.totalCost)}`);
      line(`Total sales: ${money(s.totalSales)}`);
      line(`${s.netProfit >= 0 ? 'Net profit' : 'Net loss'}: ${money(Math.abs(s.netProfit))}`, 11, true);

      doc.save(`${batch.name}-report.pdf`);
      toast.success('PDF ডাউনলোড হয়েছে');
    } catch (e) {
      console.error(e);
      toast.error('PDF তৈরি করা যায়নি');
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">📄 রিপোর্ট ও এক্সপোর্ট</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          এই ব্যাচের সম্পূর্ণ হিসাব — মুরগি, মৃত্যু, খাদ্য, ওজন, FCR, ভ্যাকসিন, ওষুধ, খরচ, বিক্রি ও লাভ-ক্ষতি।
        </p>
        <Button className="w-full gap-2" onClick={exportPdf} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} PDF রিপোর্ট
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <FileSpreadsheet className="w-4 h-4" /> CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
