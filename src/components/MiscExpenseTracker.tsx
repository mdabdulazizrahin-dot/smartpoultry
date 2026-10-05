import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, Calendar, Edit2, Trash2, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { MiscExpense } from '@/types/farm';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';

interface MiscExpenseTrackerProps {
  miscExpenses: MiscExpense[];
  onAddExpense: (expense: Omit<MiscExpense, 'id'>) => void;
  onEditExpense: (id: string, expense: Omit<MiscExpense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const formatBengaliCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

const toBengaliNumber = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

export function MiscExpenseTracker({ 
  miscExpenses, 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense 
}: MiscExpenseTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const totalExpense = miscExpenses.reduce((sum, e) => sum + e.amount, 0);
  const sortedExpenses = [...miscExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setAmount('');
    setDescription('');
    setNotes('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0 || !description) return;

    if (editingId) {
      onEditExpense(editingId, {
        date,
        amount: parseFloat(amount),
        description,
        notes: notes || undefined,
      });
    } else {
      onAddExpense({
        date,
        amount: parseFloat(amount),
        description,
        notes: notes || undefined,
      });
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (expense: MiscExpense) => {
    setEditingId(expense.id);
    setDate(expense.date);
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    setNotes(expense.notes || '');
    setIsOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              অন্যান্য খরচ
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  যোগ করুন
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'খরচ সম্পাদনা' : 'নতুন খরচ এন্ট্রি'}</DialogTitle>
                  <DialogDescription>অন্যান্য খরচের বিবরণ দিন</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>তারিখ</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>খরচ (টাকা)</Label>
                    <Input
                      type="number"
                      placeholder="০"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>খাত / বিবরণ</Label>
                    <Input
                      placeholder="যেমন: LED বাল্ব, মেরামত, সরঞ্জাম"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>নোট (ঐচ্ছিক)</Label>
                    <Textarea
                      placeholder="অতিরিক্ত তথ্য..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={!description}>
                    {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">মোট অন্যান্য খরচ</p>
              <p className="text-2xl font-bold text-purple-600">{formatBengaliCurrency(totalExpense)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                মোট {toBengaliNumber(miscExpenses.length)} টি এন্ট্রি
              </p>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" />
              হিস্ট্রি
            </div>
            
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>কোনো খরচ এন্ট্রি নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sortedExpenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-secondary/50 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(parseISO(expense.date), 'd MMMM yyyy', { locale: bn })}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-purple-600">
                          {formatBengaliCurrency(expense.amount)}
                        </p>
                        <p className="text-sm font-medium">{expense.description}</p>
                        {expense.notes && (
                          <p className="text-xs text-muted-foreground">{expense.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
