import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Plus, Calendar, Edit2, Trash2, AlertCircle, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { MedicinePurchase } from '@/types/farm';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';

interface MedicineExpenseTrackerProps {
  medicinePurchases: MedicinePurchase[];
  onAddPurchase: (purchase: Omit<MedicinePurchase, 'id'>) => void;
  onEditPurchase: (id: string, purchase: Omit<MedicinePurchase, 'id'>) => void;
  onDeletePurchase: (id: string) => void;
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

export function MedicineExpenseTracker({ 
  medicinePurchases, 
  onAddPurchase, 
  onEditPurchase, 
  onDeletePurchase 
}: MedicineExpenseTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [problem, setProblem] = useState('');
  const [notes, setNotes] = useState('');

  const totalExpense = medicinePurchases.reduce((sum, p) => sum + p.amount, 0);
  const sortedPurchases = [...medicinePurchases].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setAmount('');
    setProblem('');
    setNotes('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (editingId) {
      onEditPurchase(editingId, {
        date,
        amount: parseFloat(amount),
        problem: problem || undefined,
        notes: notes || undefined,
      });
    } else {
      onAddPurchase({
        date,
        amount: parseFloat(amount),
        problem: problem || undefined,
        notes: notes || undefined,
      });
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (purchase: MedicinePurchase) => {
    setEditingId(purchase.id);
    setDate(purchase.date);
    setAmount(purchase.amount.toString());
    setProblem(purchase.problem || '');
    setNotes(purchase.notes || '');
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
              <Pill className="w-5 h-5 text-primary" />
              ওষুধ খরচ ট্র্যাকার
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
                  <DialogTitle>{editingId ? 'ওষুধ এন্ট্রি সম্পাদনা' : 'নতুন ওষুধ এন্ট্রি'}</DialogTitle>
                  <DialogDescription>ওষুধের খরচ ও সমস্যার বিবরণ দিন</DialogDescription>
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
                    <Label>সমস্যা / কারণ (ঐচ্ছিক)</Label>
                    <Input
                      placeholder="যেমন: সর্দি, কাশি, ডায়রিয়া"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
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
                  <Button onClick={handleSubmit} className="w-full">
                    {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">মোট ওষুধ খরচ</p>
              <p className="text-2xl font-bold text-rose-600">{formatBengaliCurrency(totalExpense)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                মোট {toBengaliNumber(medicinePurchases.length)} বার কেনাকাটা
              </p>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" />
              হিস্ট্রি
            </div>
            
            {sortedPurchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>কোনো ওষুধ এন্ট্রি নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sortedPurchases.map((purchase) => (
                  <motion.div
                    key={purchase.id}
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
                            {format(parseISO(purchase.date), 'd MMMM yyyy', { locale: bn })}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-rose-600">
                          {formatBengaliCurrency(purchase.amount)}
                        </p>
                        {purchase.problem && (
                          <div className="flex items-center gap-1 text-xs text-warning">
                            <AlertCircle className="w-3 h-3" />
                            {purchase.problem}
                          </div>
                        )}
                        {purchase.notes && (
                          <p className="text-xs text-muted-foreground">{purchase.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(purchase)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onDeletePurchase(purchase.id)}
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
