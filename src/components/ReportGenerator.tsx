import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FarmData, EggSale } from '@/types/farm';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { bn } from 'date-fns/locale';
import jsPDF from 'jspdf';

interface ReportGeneratorProps {
  farmData: FarmData;
  selectedMonth: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function ReportGenerator({ farmData, selectedMonth }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<'monthly' | 'weekly'>('monthly');

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy', { locale: bn });
      options.push({ value, label });
    }
    return options;
  };

  const generateReport = () => {
    const monthDate = parseISO(`${selectedMonth}-01`);
    
    let filteredSales: EggSale[];
    let reportTitle: string;
    let dateRange: string;

    if (reportType === 'monthly') {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      filteredSales = farmData.eggSales.filter(sale => {
        const saleDate = parseISO(sale.date);
        return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
      });
      reportTitle = `মাসিক রিপোর্ট - ${format(monthDate, 'MMMM yyyy', { locale: bn })}`;
      dateRange = `${format(monthStart, 'd MMMM', { locale: bn })} থেকে ${format(monthEnd, 'd MMMM yyyy', { locale: bn })}`;
    } else {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 6 }); // Saturday
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 6 });
      filteredSales = farmData.eggSales.filter(sale => {
        const saleDate = parseISO(sale.date);
        return isWithinInterval(saleDate, { start: weekStart, end: weekEnd });
      });
      reportTitle = 'সাপ্তাহিক রিপোর্ট';
      dateRange = `${format(weekStart, 'd MMMM', { locale: bn })} থেকে ${format(weekEnd, 'd MMMM yyyy', { locale: bn })}`;
    }

    // Calculate totals
    const totalIncome = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpense = filteredSales.reduce((sum, s) => sum + s.accumulatedExpense, 0);
    const netProfit = totalIncome - totalExpense;
    const totalEggs = filteredSales.reduce((sum, s) => {
      return sum + (s.unit === 'crates' ? s.eggsOrCrates * 30 : s.eggsOrCrates);
    }, 0);

    // Generate text report
    let report = `
═══════════════════════════════════════════════════
        ${farmData.farmName}
        ${reportTitle}
═══════════════════════════════════════════════════

📅 সময়কাল: ${dateRange}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    সারসংক্ষেপ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥚 মোট ডিম বিক্রি: ${totalEggs} টি
💰 মোট আয়: ${formatCurrency(totalIncome)}
📉 মোট ব্যয়: ${formatCurrency(totalExpense)}
${netProfit >= 0 ? '📈' : '📉'} নিট ${netProfit >= 0 ? 'লাভ' : 'লোকসান'}: ${formatCurrency(Math.abs(netProfit))}
📊 বিক্রির সংখ্যা: ${filteredSales.length} বার

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  বিক্রির বিবরণ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    filteredSales
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((sale, index) => {
        const saleDate = format(parseISO(sale.date), 'd MMMM yyyy', { locale: bn });
        const eggs = sale.unit === 'crates' ? sale.eggsOrCrates * 30 : sale.eggsOrCrates;
        report += `
${index + 1}. তারিখ: ${saleDate}
   পরিমাণ: ${sale.eggsOrCrates} ${sale.unit === 'crates' ? 'ক্রেট' : 'ডিম'} (${eggs} টি)
   বিক্রি: ${formatCurrency(sale.totalAmount)} | খরচ: ${formatCurrency(sale.accumulatedExpense)}
   ${sale.profit >= 0 ? 'লাভ' : 'লোকসান'}: ${formatCurrency(Math.abs(sale.profit))}
   ────────────────────────────────────────
`;
      });

    report += `
═══════════════════════════════════════════════════
       Smart Poultry - আপনার সেরা সঙ্গী 🐔
═══════════════════════════════════════════════════
`;

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType === 'monthly' ? 'মাসিক' : 'সাপ্তাহিক'}-রিপোর্ট-${selectedMonth}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            রিপোর্ট জেনারেটর
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>রিপোর্টের ধরন</Label>
            <Select value={reportType} onValueChange={(v: 'monthly' | 'weekly') => setReportType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">মাসিক রিপোর্ট</SelectItem>
                <SelectItem value="weekly">সাপ্তাহিক রিপোর্ট</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateReport} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            রিপোর্ট ডাউনলোড করুন
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            📄 টেক্সট ফাইল হিসেবে ডাউনলোড হবে
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
