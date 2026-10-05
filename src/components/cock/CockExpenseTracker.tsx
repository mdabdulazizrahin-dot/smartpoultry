import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CockBatch, CockExpenseCategory, COCK_EXPENSE_CATEGORIES } from '@/types/poultry';
import { getCockStats, bnCurrency, toBn } from '@/lib/cockCalculations';
import { Plus, Trash2, Edit2, Calendar, History, Receipt } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: CockBatch;
  onUpdate: (fn: (b: CockBatch) => CockBatch) => void;
}

const blank = () => ({
  date: new Date().toISOString().split('T')[0],
  category: 'labour' as CockExpenseCategory,
  description: '',
  amount: '',
});

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

export function CockExpenseTracker({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());
  const s = getCockStats(batch);

  const openNew = () => { setEditId(null); setForm(blank()); setOpen(true); };
  const openEdit = (e: CockBatch['expenses'][number]) => {
    setEditId(e.id);
    setForm({ date: e.date, category: e.category, description: e.description || '', amount: String(e.amount || '') });
    setOpen(true);
  };

  const save = () => {
    const amount = parseFloat(form.amount) || 0;
    if (amount <= 0) return toast.error('টাকার পরিমাণ দিন');
    const record = {
      id: editId || crypto.randomUUID(),
      date: form.date,
      category: form.category,
      description: form.description || undefined,
      amount,
    };
    onUpdate((b) => ({
      ...b,
      expenses: editId ? b.expenses.map((e) => (e.id === editId ? record : e)) : [...b.expenses, record],
    }));
    setOpen(false);
    setEditId(null);
    setForm(blank());
    toast.success(editId ? 'খরচ হালনাগাদ হয়েছে' : 'খরচ সংরক্ষিত');
  };

  const remove = (id: string) => {
    onUpdate((b) => ({ ...b, expenses: b.expenses.filter((e) => e.id !== id) }));
    toast.success('খরচ মুছে ফেলা হয়েছে');
  };

  const sorted = [...batch.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const label = (c: CockExpenseCategory) => COCK_EXPENSE_CATEGORIES.find((x) => x.id === c)?.label || c;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              অন্যান্য খরচ
            </div>
            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm" onClick={openNew}>
              <Plus className="w-4 h-4" />
              যোগ করুন
            </Button>
          </CardTitle>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { setEditId(null); setForm(blank()); }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editId ? 'খরচ সম্পাদনা' : 'নতুন খরচ এন্ট্রি'}</DialogTitle>
                <DialogDescription>পরিচালনা ও বিবিধ খরচের হিসাব দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>খরচের খাত / ধরন</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CockExpenseCategory })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {COCK_EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>বিবরণ (ঐচ্ছিক)</Label>
                  <Input placeholder="যেমন: তুস ক্রয় / বিদ্যুৎ বিল..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>টাকার পরিমাণ (৳)</Label>
                  <Input type="number" placeholder="০" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <Button className="w-full mt-2" onClick={save}>
                  {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Banner - Image 2 style */}
          <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border border-purple-200/50 dark:border-purple-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">মোট অন্যান্য খরচ</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                {bnCurrency(s.expenseCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                মোট {toBn(sorted.length)} টি এন্ট্রি
              </p>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" />
              হিস্ট্রি
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>কোনো খরচ এন্ট্রি নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sorted.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-secondary/50 hover:bg-secondary/70 transition-colors rounded-xl p-3.5 border border-border/40"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {formatDisplayDate(e.date)}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {bnCurrency(e.amount)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {label(e.category)}
                        </p>
                        {e.description && (
                          <p className="text-xs text-muted-foreground">{e.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(e)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(e.id)}
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
