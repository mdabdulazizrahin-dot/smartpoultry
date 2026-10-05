import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Egg, Plus, Trash2, TrendingUp, TrendingDown, Calendar, Pencil, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EggSale } from '@/types/farm';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, parse } from 'date-fns';
import { bn } from 'date-fns/locale';

interface MonthlyAverage {
  month: string; // YYYY-MM
  monthName: string;
  avgPricePerEgg: number;
  totalEggs: number;
  totalSales: number;
}

interface MonthlyStats {
  totalSales: number;
  totalEggs: number;
  avgPricePerEgg: number;
  salesCount: number;
}

interface EggSalesTrackerProps {
  sales: EggSale[];
  onAddSale: (sale: Omit<EggSale, 'id' | 'totalAmount' | 'accumulatedExpense' | 'profit'>) => void;
  onEditSale: (id: string, sale: Omit<EggSale, 'id' | 'totalAmount' | 'accumulatedExpense' | 'profit'>) => void;
  onDeleteSale: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function EggSalesTracker({ sales, onAddSale, onEditSale, onDeleteSale }: EggSalesTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eggsOrCrates, setEggsOrCrates] = useState<number>(0);
  const [unit, setUnit] = useState<'eggs' | 'crates'>('crates');
  const [ratePerUnit, setRatePerUnit] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = () => {
    if (eggsOrCrates > 0 && ratePerUnit > 0) {
      if (isEditMode && editingId) {
        onEditSale(editingId, {
          date,
          eggsOrCrates,
          unit,
          ratePerUnit,
          notes: notes.trim() || undefined,
        });
      } else {
        onAddSale({
          date,
          eggsOrCrates,
          unit,
          ratePerUnit,
          notes: notes.trim() || undefined,
        });
      }
      setIsOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setEggsOrCrates(0);
    setRatePerUnit(0);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setIsEditMode(false);
    setEditingId(null);
  };

  const openEditDialog = (sale: EggSale) => {
    setIsEditMode(true);
    setEditingId(sale.id);
    setDate(sale.date);
    setEggsOrCrates(sale.eggsOrCrates);
    setUnit(sale.unit);
    setRatePerUnit(sale.ratePerUnit);
    setNotes(sale.notes || '');
    setIsOpen(true);
  };

  const totalEggs = unit === 'crates' ? eggsOrCrates * 30 : eggsOrCrates;
  // CORRECT: total eggs × rate per egg
  const estimatedTotal = totalEggs * ratePerUnit;

  // Download summary function
  const downloadSaleSummary = (sale: EggSale) => {
    const dateFormatted = format(parseISO(sale.date), 'd MMMM yyyy', { locale: bn });
    const profitLoss = sale.profit >= 0 ? 'লাভ' : 'লোকসান';
    
    const summary = `
=================================================
       ডিম বিক্রি সারাংশ
=================================================

তারিখ: ${dateFormatted}

বিক্রির বিবরণ:
-----------------
পরিমাণ: ${sale.eggsOrCrates} ${sale.unit === 'crates' ? 'ক্রেট' : 'ডিম'}
মোট ডিম: ${sale.unit === 'crates' ? sale.eggsOrCrates * 30 : sale.eggsOrCrates} টি
প্রতি ডিমের দাম: ${formatCurrency(sale.ratePerUnit)}

আর্থিক বিবরণ:
-----------------
মোট বিক্রি: ${formatCurrency(sale.totalAmount)}
মোট খরচ: ${formatCurrency(sale.accumulatedExpense)}
${profitLoss}: ${formatCurrency(Math.abs(sale.profit))}

=================================================
        Smart Poultry
=================================================
    `.trim();

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `বিক্রি-সারাংশ-${sale.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sort sales by date (newest first)
  const sortedSales = [...sales].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate current month stats
  const getCurrentMonthStats = (): MonthlyStats => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const currentMonthSales = sales.filter(sale => {
      const saleDate = parseISO(sale.date);
      return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
    });

    const totalSales = currentMonthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalEggs = currentMonthSales.reduce((sum, s) => {
      return sum + (s.unit === 'crates' ? s.eggsOrCrates * 30 : s.eggsOrCrates);
    }, 0);
    
    return {
      totalSales,
      totalEggs,
      avgPricePerEgg: totalEggs > 0 ? totalSales / totalEggs : 0,
      salesCount: currentMonthSales.length
    };
  };

  const monthlyStats = getCurrentMonthStats();
  const currentMonthName = format(new Date(), 'MMMM', { locale: bn });

  // Calculate monthly averages for all months with sales
  const getMonthlyAverages = (): MonthlyAverage[] => {
    const monthlyData: { [key: string]: { totalSales: number; totalEggs: number } } = {};
    
    sales.forEach(sale => {
      const monthKey = sale.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalSales: 0, totalEggs: 0 };
      }
      monthlyData[monthKey].totalSales += sale.totalAmount;
      monthlyData[monthKey].totalEggs += sale.unit === 'crates' ? sale.eggsOrCrates * 30 : sale.eggsOrCrates;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        monthName: format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: bn }),
        avgPricePerEgg: data.totalEggs > 0 ? data.totalSales / data.totalEggs : 0,
        totalEggs: data.totalEggs,
        totalSales: data.totalSales
      }))
      .sort((a, b) => b.month.localeCompare(a.month)); // Newest first
  };

  const monthlyAverages = getMonthlyAverages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Egg className="w-5 h-5 text-warning" />
              ডিম বিক্রি
            </CardTitle>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="w-4 h-4 mr-1" />
                  বিক্রি যোগ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? 'বিক্রি এডিট করুন' : 'ডিম বিক্রি এন্ট্রি'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      তারিখ
                    </Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  {/* Unit selector */}
                  <div className="space-y-2">
                    <Label>একক নির্বাচন</Label>
                    <Select value={unit} onValueChange={(v: 'eggs' | 'crates') => setUnit(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crates">ক্রেট (৩০টি ডিম)</SelectItem>
                        <SelectItem value="eggs">পিস ডিম</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label>
                      {unit === 'crates' ? 'ক্রেট সংখ্যা' : 'ডিম সংখ্যা'}
                    </Label>
                    <Input
                      type="number"
                      placeholder={unit === 'crates' ? 'যেমন: ১০' : 'যেমন: ৩০০'}
                      value={eggsOrCrates || ''}
                      onChange={(e) => setEggsOrCrates(Number(e.target.value))}
                    />
                    {unit === 'crates' && eggsOrCrates > 0 && (
                      <p className="text-xs text-muted-foreground">
                        মোট ডিম: {totalEggs} টি
                      </p>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="space-y-2">
                    <Label>প্রতি ডিমের দাম</Label>
                    <Input
                      type="number"
                      placeholder="টাকা"
                      value={ratePerUnit || ''}
                      onChange={(e) => setRatePerUnit(Number(e.target.value))}
                    />
                  </div>

                  {/* Notes (optional) */}
                  <div className="space-y-2">
                    <Label>নোট (ঐচ্ছিক)</Label>
                    <Textarea
                      placeholder="অতিরিক্ত তথ্য..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>


                  {/* Preview */}
                  {eggsOrCrates > 0 && ratePerUnit > 0 && (
                    <div className="bg-secondary rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">আনুমানিক বিক্রি:</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(estimatedTotal)}</p>
                    </div>
                  )}

                  <Button onClick={handleSubmit} className="w-full" size="lg">
                    সেভ করুন
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Monthly Price History */}
          {monthlyAverages.length > 0 && (
            <div className="bg-gradient-to-r from-primary/10 to-warning/10 rounded-lg p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">📊 মাসভিত্তিক গড় দর (প্রতি ডিম)</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {monthlyAverages.map((monthData) => (
                  <div key={monthData.month} className="flex items-center justify-between bg-background/50 rounded-md px-2 py-1.5">
                    <span className="text-sm font-medium">{monthData.monthName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{monthData.totalEggs} ডিম</span>
                      <span className="text-sm font-bold text-success">{monthData.avgPricePerEgg.toFixed(2)}৳</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sortedSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Egg className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>এখনো কোন বিক্রি হয়নি</p>
              <p className="text-sm">উপরে "বিক্রি যোগ" বাটনে ক্লিক করুন</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {sortedSales.map((sale, index) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/50 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(sale.date), 'd MMM yyyy', { locale: bn })}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sale.profit >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                            {sale.profit >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                            {sale.profit >= 0 ? 'লাভ' : 'লোকসান'}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {sale.eggsOrCrates} {sale.unit === 'crates' ? 'ক্রেট' : 'ডিম'} × {formatCurrency(sale.ratePerUnit)}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">বিক্রি:</span>
                            <p className="font-medium text-success">{formatCurrency(sale.totalAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">খরচ:</span>
                            <p className="font-medium text-destructive">{formatCurrency(sale.accumulatedExpense)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{sale.profit >= 0 ? 'লাভ:' : 'লোকসান:'}</span>
                            <p className={`font-bold ${sale.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {formatCurrency(Math.abs(sale.profit))}
                            </p>
                          </div>
                        </div>
                        {sale.notes && (
                          <p className="mt-2 text-xs text-muted-foreground bg-background/60 rounded-md px-2 py-1.5 whitespace-pre-wrap">
                            📝 {sale.notes}
                          </p>
                        )}
                        {/* Download Summary Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full text-xs"
                          onClick={() => downloadSaleSummary(sale)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          সারাংশ ডাউনলোড
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEditDialog(sale)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteSale(sale.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
