import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FarmData } from '@/types/farm';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { bn } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PDFReportGeneratorProps {
  farmData: FarmData;
  selectedMonth: string;
}

export function PDFReportGenerator({ farmData, selectedMonth }: PDFReportGeneratorProps) {
  const [reportType, setReportType] = useState<'monthly' | 'weekly'>('monthly');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} BDT`;
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const monthDate = parseISO(`${selectedMonth}-01`);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, 'MMMM yyyy', { locale: bn });

      // Filter data for selected month
      const filteredSales = farmData.eggSales.filter(sale => {
        const saleDate = parseISO(sale.date);
        return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
      });

      const filteredFeed = (farmData.flockInfo?.feedPurchases || []).filter(p => {
        const date = parseISO(p.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const filteredMedicine = (farmData.flockInfo?.medicinePurchases || []).filter(p => {
        const date = parseISO(p.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const filteredMisc = (farmData.flockInfo?.miscExpenses || []).filter(e => {
        const date = parseISO(e.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const filteredProduction = (farmData.flockInfo?.eggProductions || []).filter(p => {
        const date = parseISO(p.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const filteredMortality = (farmData.flockInfo?.mortalityRecords || []).filter(r => {
        const date = parseISO(r.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      // Calculate totals
      const totalSalesIncome = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalSalesExpense = filteredSales.reduce((sum, s) => sum + s.accumulatedExpense, 0);
      const totalFeedCost = filteredFeed.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalMedicineCost = filteredMedicine.reduce((sum, p) => sum + p.amount, 0);
      const totalMiscCost = filteredMisc.reduce((sum, e) => sum + e.amount, 0);
      const totalMortality = filteredMortality.reduce((sum, r) => sum + r.count, 0);
      const avgProductionRate = filteredProduction.length > 0 
        ? filteredProduction.reduce((sum, p) => sum + p.productionRate, 0) / filteredProduction.length 
        : 0;
      const totalEggs = filteredSales.reduce((sum, s) => sum + (s.unit === 'crates' ? s.eggsOrCrates * 30 : s.eggsOrCrates), 0);
      const totalEggsProduced = filteredProduction.reduce((sum, p) => sum + p.eggsCollected, 0);

      // Create PDF (simple approach for Bengali text)
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(farmData.farmName, 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`Monthly Report - ${format(monthDate, 'MMMM yyyy')}`, 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy')}`, 105, 38, { align: 'center' });

      // Summary Box
      let yPos = 50;
      doc.setFontSize(12);
      doc.setDrawColor(0);
      doc.rect(15, yPos - 5, 180, 50);
      doc.text('SUMMARY', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Total Eggs Sold: ${totalEggs.toLocaleString()}`, 20, yPos);
      doc.text(`Total Eggs Produced: ${totalEggsProduced.toLocaleString()}`, 110, yPos);
      yPos += 8;
      
      doc.text(`Sales Income: ${formatCurrency(totalSalesIncome)}`, 20, yPos);
      doc.text(`Sales Expense: ${formatCurrency(totalSalesExpense)}`, 110, yPos);
      yPos += 8;
      
      doc.text(`Feed Cost: ${formatCurrency(totalFeedCost)}`, 20, yPos);
      doc.text(`Medicine Cost: ${formatCurrency(totalMedicineCost)}`, 110, yPos);
      yPos += 8;
      
      doc.text(`Misc Expenses: ${formatCurrency(totalMiscCost)}`, 20, yPos);
      doc.text(`Total Mortality: ${totalMortality}`, 110, yPos);
      yPos += 8;
      
      const netProfit = totalSalesIncome - totalSalesExpense;
      doc.setFontSize(11);
      doc.text(`NET ${netProfit >= 0 ? 'PROFIT' : 'LOSS'}: ${formatCurrency(Math.abs(netProfit))}`, 20, yPos);
      doc.text(`Avg Production Rate: ${avgProductionRate.toFixed(1)}%`, 110, yPos);
      
      yPos += 20;

      // Egg Sales Table
      if (filteredSales.length > 0) {
        doc.setFontSize(12);
        doc.text('EGG SALES', 20, yPos);
        yPos += 6;
        
        doc.setFontSize(9);
        doc.text('Date', 20, yPos);
        doc.text('Quantity', 50, yPos);
        doc.text('Amount', 80, yPos);
        doc.text('Expense', 110, yPos);
        doc.text('Profit', 140, yPos);
        yPos += 5;
        doc.line(20, yPos, 170, yPos);
        yPos += 5;
        
        filteredSales.slice(0, 10).forEach(sale => {
          doc.text(sale.date, 20, yPos);
          doc.text(`${sale.eggsOrCrates} ${sale.unit === 'crates' ? 'crate' : 'eggs'}`, 50, yPos);
          doc.text(formatCurrency(sale.totalAmount), 80, yPos);
          doc.text(formatCurrency(sale.accumulatedExpense), 110, yPos);
          doc.text(formatCurrency(sale.profit), 140, yPos);
          yPos += 6;
          
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
        
        if (filteredSales.length > 10) {
          doc.text(`... and ${filteredSales.length - 10} more records`, 20, yPos);
          yPos += 8;
        }
        yPos += 10;
      }

      // Feed Purchases
      if (filteredFeed.length > 0 && yPos < 250) {
        doc.setFontSize(12);
        doc.text('FEED PURCHASES', 20, yPos);
        yPos += 6;
        
        doc.setFontSize(9);
        filteredFeed.slice(0, 5).forEach(p => {
          doc.text(`${p.date}: ${p.bags} bags @ ${formatCurrency(p.pricePerBag)} = ${formatCurrency(p.totalAmount)}`, 20, yPos);
          yPos += 6;
        });
        yPos += 8;
      }

      // Footer
      doc.setFontSize(8);
      doc.text(`${farmData.farmName} - Poultry Farm Management System`, 105, 285, { align: 'center' });

      // Save
      const filename = `Farm-Report-${selectedMonth}.pdf`;
      doc.save(filename);
      
      toast.success('PDF রিপোর্ট ডাউনলোড হয়েছে');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF তৈরিতে সমস্যা হয়েছে');
    }

    setIsGenerating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            PDF রিপোর্ট
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            মাসিক সম্পূর্ণ রিপোর্ট PDF ফাইলে ডাউনলোড করুন। এতে থাকবে বিক্রি, খরচ, উৎপাদন ও অন্যান্য তথ্য।
          </p>

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

          <Button 
            onClick={generatePDF} 
            className="w-full gap-2" 
            size="lg"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF ডাউনলোড করুন
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            📄 বিস্তারিত চার্ট ও তথ্যসহ PDF ফাইল
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
