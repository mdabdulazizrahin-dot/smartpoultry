import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Pill, Package, Plus, Save, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MonthlyExpense } from '@/types/farm';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

interface MonthlyExpenseFormProps {
  currentMonth: string;
  existingExpense?: MonthlyExpense;
  dailyExpense: number;
  onSave: (expense: Omit<MonthlyExpense, 'id'>) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function MonthlyExpenseForm({ currentMonth, existingExpense, dailyExpense, onSave }: MonthlyExpenseFormProps) {
  const [electricity, setElectricity] = useState(existingExpense?.electricity || 0);
  const [medicine, setMedicine] = useState(existingExpense?.medicine || 0);
  const [feedBagPrice, setFeedBagPrice] = useState(existingExpense?.feedBagPrice || 0);
  const [dailyFeedConsumptionKg, setDailyFeedConsumptionKg] = useState(existingExpense?.dailyFeedConsumptionKg || 0);
  const [otherExpenses, setOtherExpenses] = useState(existingExpense?.otherExpenses || 0);

  useEffect(() => {
    if (existingExpense) {
      setElectricity(existingExpense.electricity);
      setMedicine(existingExpense.medicine);
      setFeedBagPrice(existingExpense.feedBagPrice);
      setDailyFeedConsumptionKg(existingExpense.dailyFeedConsumptionKg);
      setOtherExpenses(existingExpense.otherExpenses);
    }
  }, [existingExpense]);

  // Calculate actual days in the selected month
  const monthDate = new Date(currentMonth + '-01');
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  
  // Fixed monthly expense (without feed - feed is calculated per sale)
  const fixedMonthlyExpense = electricity + medicine + otherExpenses;
  // Daily feed cost for display
  const dailyFeedCost = feedBagPrice > 0 ? (feedBagPrice / 50) * dailyFeedConsumptionKg : 0;
  const monthName = format(monthDate, 'MMMM yyyy', { locale: bn });

  const handleSave = () => {
    onSave({
      month: currentMonth,
      electricity,
      medicine,
      feedBagPrice,
      dailyFeedConsumptionKg,
      otherExpenses
    });
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
            <Calculator className="w-5 h-5 text-primary" />
            মাসিক খরচ ({monthName})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Electricity */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-warning" />
              বিদ্যুৎ বিল
            </Label>
            <Input
              type="number"
              placeholder="যেমন: ১০০০"
              value={electricity || ''}
              onChange={(e) => setElectricity(Number(e.target.value))}
              className="text-right"
            />
          </div>

          {/* Medicine */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Pill className="w-4 h-4 text-destructive" />
              ওষুধ খরচ
            </Label>
            <Input
              type="number"
              placeholder="যেমন: ১৫০০"
              value={medicine || ''}
              onChange={(e) => setMedicine(Number(e.target.value))}
              className="text-right"
            />
          </div>

          {/* Feed */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-accent-foreground" />
              খাবার (ফিড)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">বস্তার দাম (৫০ কেজি)</p>
                <Input
                  type="number"
                  placeholder="টাকা"
                  value={feedBagPrice || ''}
                  onChange={(e) => setFeedBagPrice(Number(e.target.value))}
                  className="text-right"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">দৈনিক খাবার (কেজি)</p>
                <Input
                  type="number"
                  placeholder="কেজি"
                  value={dailyFeedConsumptionKg || ''}
                  onChange={(e) => setDailyFeedConsumptionKg(Number(e.target.value))}
                  className="text-right"
                />
              </div>
            </div>
            {feedBagPrice > 0 && dailyFeedConsumptionKg > 0 && (
              <p className="text-xs text-muted-foreground">
                দৈনিক ফিড খরচ: {formatCurrency(dailyFeedCost)}
              </p>
            )}
          </div>

          {/* Other Expenses */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4 text-muted-foreground" />
              অন্যান্য খরচ
            </Label>
            <Input
              type="number"
              placeholder="যেমন: ৫০০"
              value={otherExpenses || ''}
              onChange={(e) => setOtherExpenses(Number(e.target.value))}
              className="text-right"
            />
          </div>

          {/* Summary */}
          <div className="bg-secondary rounded-lg p-4 space-y-3">
            {/* Daily breakdown of fixed costs */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">দৈনিক স্থায়ী খরচ ({daysInMonth} দিনে ভাগ):</p>
              <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                <span className="text-muted-foreground">বিদ্যুৎ:</span>
                <span className="font-medium">{formatCurrency(electricity / daysInMonth)}</span>
                <span className="text-muted-foreground">ওষুধ:</span>
                <span className="font-medium">{formatCurrency(medicine / daysInMonth)}</span>
                <span className="text-muted-foreground">অন্যান্য:</span>
                <span className="font-medium">{formatCurrency(otherExpenses / daysInMonth)}</span>
              </div>
            </div>
            
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>দৈনিক স্থায়ী খরচ (৩টির যোগফল):</span>
                <span className="font-medium">{formatCurrency(fixedMonthlyExpense / daysInMonth)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>দৈনিক ফিড খরচ:</span>
                <span className="font-medium">{formatCurrency(dailyFeedCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-primary border-t pt-2 mt-2">
                <span>মোট দৈনিক খরচ:</span>
                <span>{formatCurrency((fixedMonthlyExpense / daysInMonth) + dailyFeedCost)}</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              * ফিড খরচ ডিম বিক্রির সময় স্বয়ংক্রিয়ভাবে হিসাব হবে
            </p>
          </div>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            সেভ করুন
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
