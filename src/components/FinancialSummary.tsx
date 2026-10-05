import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface FinancialSummaryProps {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export function FinancialSummary({ 
  totalIncome, 
  totalExpense, 
  netProfit,
  currentMonth,
  onMonthChange
}: FinancialSummaryProps) {
  const { language, t } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Generate last 12 months
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy', language === 'bn' ? { locale: bn } : undefined);
      months.push({ value, label });
    }
    return months;
  };

  const monthOptions = getMonthOptions();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Month selector */}
      <div className="flex justify-center mb-3">
        <select
          value={currentMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-secondary text-foreground text-sm px-3 py-1.5 rounded-lg border border-border cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} {language === 'bn' ? 'এর হিসাব' : 'Overview'}
            </option>
          ))}
        </select>
      </div>
      
      <Card className={`mb-4 overflow-hidden border-0 shadow-lg ${netProfit >= 0 ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-gradient-to-br from-destructive to-destructive/80'}`}>
        <CardContent className="p-6 text-center text-primary-foreground">
          <div className="card-icon-3d inline-block mb-2">
            <Wallet className="w-10 h-10 opacity-90" />
          </div>
          <p className="text-sm opacity-90 mb-1">
            {netProfit >= 0 ? t('monthlyProfit') : t('monthlyLoss')}
          </p>
          <motion.p 
            className="text-4xl font-bold"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {formatCurrency(Math.abs(netProfit))}
          </motion.p>
          <p className="text-sm mt-2 opacity-80">
            {netProfit >= 0 ? t('doingWell') : t('reduceCost')}
          </p>
        </CardContent>
      </Card>

      {/* Income and Expense cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 bg-gradient-to-br from-success/90 to-success text-success-foreground">
              <div className="flex items-center gap-2 mb-2">
                <div className="tab-icon-3d bg-gradient-to-br from-success-foreground/20 to-success-foreground/10 p-1.5 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{t('totalIncome')}</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-4 bg-gradient-to-br from-destructive/90 to-destructive text-destructive-foreground">
              <div className="flex items-center gap-2 mb-2">
                <div className="tab-icon-3d bg-gradient-to-br from-destructive-foreground/20 to-destructive-foreground/10 p-1.5 rounded-lg">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{t('totalExpense')}</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
