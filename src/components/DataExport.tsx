import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FarmData } from '@/types/farm';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface DataExportProps {
  farmData: FarmData;
}

export function DataExport({ farmData }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = (data: any[], headers: string[], filename: string) => {
    if (data.length === 0) return '';
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h] ?? '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(['\ufeff' + content], { type: `${mimeType};charset=utf-8` }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // 1. Egg Sales
      const eggSalesData = farmData.eggSales.map(sale => ({
        'তারিখ': sale.date,
        'পরিমাণ': sale.eggsOrCrates,
        'একক': sale.unit === 'crates' ? 'ক্রেট' : 'ডিম',
        'রেট': sale.ratePerUnit,
        'মোট বিক্রি': sale.totalAmount,
        'খরচ': sale.accumulatedExpense,
        'লাভ': sale.profit,
      }));
      if (eggSalesData.length > 0) {
        const csv = generateCSV(eggSalesData, ['তারিখ', 'পরিমাণ', 'একক', 'রেট', 'মোট বিক্রি', 'খরচ', 'লাভ'], 'egg-sales');
        downloadFile(csv, `ডিম-বিক্রি-${today}.csv`, 'text/csv');
      }

      // 2. Feed Purchases
      const feedData = (farmData.flockInfo?.feedPurchases || []).map(p => ({
        'তারিখ': p.date,
        'বস্তা': p.bags,
        'প্রতি বস্তা': p.pricePerBag,
        'মোট': p.totalAmount,
        'নোট': p.notes || '',
      }));
      if (feedData.length > 0) {
        const csv = generateCSV(feedData, ['তারিখ', 'বস্তা', 'প্রতি বস্তা', 'মোট', 'নোট'], 'feed');
        downloadFile(csv, `খাদ্য-${today}.csv`, 'text/csv');
      }

      // 3. Medicine Purchases
      const medicineData = (farmData.flockInfo?.medicinePurchases || []).map(p => ({
        'তারিখ': p.date,
        'খরচ': p.amount,
        'সমস্যা': p.problem || '',
        'নোট': p.notes || '',
      }));
      if (medicineData.length > 0) {
        const csv = generateCSV(medicineData, ['তারিখ', 'খরচ', 'সমস্যা', 'নোট'], 'medicine');
        downloadFile(csv, `ওষুধ-${today}.csv`, 'text/csv');
      }

      // 4. Misc Expenses
      const miscData = (farmData.flockInfo?.miscExpenses || []).map(e => ({
        'তারিখ': e.date,
        'খরচ': e.amount,
        'খাত': e.description,
        'নোট': e.notes || '',
      }));
      if (miscData.length > 0) {
        const csv = generateCSV(miscData, ['তারিখ', 'খরচ', 'খাত', 'নোট'], 'misc');
        downloadFile(csv, `অন্যান্য-খরচ-${today}.csv`, 'text/csv');
      }

      // 5. Egg Production
      const productionData = (farmData.flockInfo?.eggProductions || []).map(p => ({
        'তারিখ': p.date,
        'ডিম সংখ্যা': p.eggsCollected,
        'উৎপাদন হার': `${p.productionRate.toFixed(1)}%`,
        'নোট': p.notes || '',
      }));
      if (productionData.length > 0) {
        const csv = generateCSV(productionData, ['তারিখ', 'ডিম সংখ্যা', 'উৎপাদন হার', 'নোট'], 'production');
        downloadFile(csv, `ডিম-উৎপাদন-${today}.csv`, 'text/csv');
      }

      // 6. Mortality
      const mortalityData = (farmData.flockInfo?.mortalityRecords || []).map(r => ({
        'তারিখ': r.date,
        'মৃত্যু সংখ্যা': r.count,
        'নোট': r.notes || '',
      }));
      if (mortalityData.length > 0) {
        const csv = generateCSV(mortalityData, ['তারিখ', 'মৃত্যু সংখ্যা', 'নোট'], 'mortality');
        downloadFile(csv, `মৃত্যু-${today}.csv`, 'text/csv');
      }

      toast.success('সব ডেটা CSV ফাইলে এক্সপোর্ট হয়েছে');
    } catch (error) {
      toast.error('এক্সপোর্টে সমস্যা হয়েছে');
    }
    
    setIsExporting(false);
  };

  const exportAllToSingleCSV = () => {
    setIsExporting(true);
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      let allContent = '';
      
      // Summary section
      const totalFeed = (farmData.flockInfo?.feedPurchases || []).reduce((s, p) => s + p.totalAmount, 0);
      const totalMedicine = (farmData.flockInfo?.medicinePurchases || []).reduce((s, p) => s + p.amount, 0);
      const totalMisc = (farmData.flockInfo?.miscExpenses || []).reduce((s, e) => s + e.amount, 0);
      const totalSales = farmData.eggSales.reduce((s, e) => s + e.totalAmount, 0);
      const totalExpenses = farmData.eggSales.reduce((s, e) => s + e.accumulatedExpense, 0);
      
      allContent += `${farmData.farmName} - সম্পূর্ণ রিপোর্ট\n`;
      allContent += `তারিখ: ${today}\n\n`;
      allContent += `সারসংক্ষেপ\n`;
      allContent += `মোট ডিম বিক্রি,${totalSales}\n`;
      allContent += `মোট খরচ,${totalExpenses}\n`;
      allContent += `মোট খাদ্য খরচ,${totalFeed}\n`;
      allContent += `মোট ওষুধ খরচ,${totalMedicine}\n`;
      allContent += `মোট অন্যান্য খরচ,${totalMisc}\n`;
      allContent += `\n---\n\n`;

      // Egg Sales
      allContent += `ডিম বিক্রি\n`;
      allContent += `তারিখ,পরিমাণ,একক,রেট,মোট বিক্রি,খরচ,লাভ\n`;
      farmData.eggSales.forEach(sale => {
        allContent += `${sale.date},${sale.eggsOrCrates},${sale.unit === 'crates' ? 'ক্রেট' : 'ডিম'},${sale.ratePerUnit},${sale.totalAmount},${sale.accumulatedExpense},${sale.profit}\n`;
      });
      allContent += `\n---\n\n`;

      // Feed
      allContent += `খাদ্য ক্রয়\n`;
      allContent += `তারিখ,বস্তা,প্রতি বস্তা,মোট\n`;
      (farmData.flockInfo?.feedPurchases || []).forEach(p => {
        allContent += `${p.date},${p.bags},${p.pricePerBag},${p.totalAmount}\n`;
      });
      allContent += `\n---\n\n`;

      // Medicine
      allContent += `ওষুধ ক্রয়\n`;
      allContent += `তারিখ,খরচ,সমস্যা\n`;
      (farmData.flockInfo?.medicinePurchases || []).forEach(p => {
        allContent += `${p.date},${p.amount},${p.problem || ''}\n`;
      });
      allContent += `\n---\n\n`;

      // Misc
      allContent += `অন্যান্য খরচ\n`;
      allContent += `তারিখ,খরচ,খাত\n`;
      (farmData.flockInfo?.miscExpenses || []).forEach(e => {
        allContent += `${e.date},${e.amount},${e.description}\n`;
      });

      downloadFile(allContent, `সম্পূর্ণ-রিপোর্ট-${today}.csv`, 'text/csv');
      toast.success('সম্পূর্ণ রিপোর্ট এক্সপোর্ট হয়েছে');
    } catch (error) {
      toast.error('এক্সপোর্টে সমস্যা হয়েছে');
    }
    
    setIsExporting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            ডেটা এক্সপোর্ট
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            আপনার সব হিসাব CSV ফাইলে ডাউনলোড করুন। Excel বা Google Sheets এ খোলা যাবে।
          </p>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={exportAllToSingleCSV} 
              className="w-full gap-2"
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              সম্পূর্ণ রিপোর্ট (একটি ফাইল)
            </Button>
            
            <Button 
              onClick={exportToCSV} 
              variant="outline"
              className="w-full gap-2"
              disabled={isExporting}
            >
              <FileText className="w-4 h-4" />
              আলাদা আলাদা ফাইল
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            📊 CSV ফরম্যাটে ডাউনলোড হবে
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
