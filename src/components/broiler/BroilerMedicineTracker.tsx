import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BroilerBatch } from '@/types/poultry';
import { getBroilerStats, bnCurrency, toBn } from '@/lib/broilerCalculations';
import { Plus, Trash2, Edit2, Pill, Calendar, AlertCircle, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: BroilerBatch;
  onUpdate: (fn: (b: BroilerBatch) => BroilerBatch) => void;
}

const blank = () => ({
  date: new Date().toISOString().split('T')[0],
  problem: '',
  medicineName: '',
  amount: '',
  notes: '',
});

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

export function BroilerMedicineTracker({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());
  const s = getBroilerStats(batch);

  const openNew = () => {
    setEditId(null);
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (m: BroilerBatch['medicines'][number]) => {
    setEditId(m.id);
    setForm({
      date: m.date,
      problem: m.problem || '',
      medicineName: m.medicineName,
      amount: String(m.amount || ''),
      notes: m.notes || '',
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.medicineName.trim()) return toast.error('ওষুধের নাম দিন');
    const amount = parseFloat(form.amount) || 0;

    const record = {
      id: editId || crypto.randomUUID(),
      date: form.date,
      problem: form.problem || undefined,
      medicineName: form.medicineName.trim(),
      amount,
      notes: form.notes || undefined,
    };

    onUpdate((b) => ({
      ...b,
      medicines: editId
        ? b.medicines.map((m) => (m.id === editId ? record : m))
        : [...b.medicines, record],
    }));

    setOpen(false);
    setEditId(null);
    setForm(blank());
    toast.success(editId ? 'ওষুধ রেকর্ড হালনাগাদ হয়েছে' : 'ওষুধ রেকর্ড সংরক্ষিত');
  };

  const remove = (id: string) => {
    onUpdate((b) => ({ ...b, medicines: b.medicines.filter((m) => m.id !== id) }));
    toast.success('ওষুধ রেকর্ড মুছে ফেলা হয়েছে');
  };

  const sorted = [...(batch.medicines || [])].sort((a, b) => b.date.localeCompare(a.date));

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
              <Pill className="w-5 h-5 text-primary" />
              ওষুধ খরচ ট্র্যাকার
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
                <DialogTitle>{editId ? 'ওষুধ এন্ট্রি সম্পাদনা' : 'নতুন ওষুধ এন্ট্রি'}</DialogTitle>
                <DialogDescription>ওষুধের খরচ ও সমস্যার বিবরণ দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>ওষুধের নাম</Label>
                  <Input placeholder="যেমন: রেনামাইসিন / ইলেক্ট্রোলাইট..." value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} />
                </div>
                <div>
                  <Label>খরচ (টাকা)</Label>
                  <Input type="number" placeholder="০" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>সমস্যা / রোগ (ঐচ্ছিক)</Label>
                  <Input placeholder="যেমন: সর্দি, কাশি, চুনা পায়খানা" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea placeholder="ডোজ ও ব্যবহারের নিয়ম..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <Button className="w-full mt-2" onClick={save}>
                  {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 border border-rose-200/50 dark:border-rose-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">মোট ওষুধ খরচ</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">{bnCurrency(s.medicineCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                মোট {toBn(sorted.length)} বার কেনাকাটা
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
                <Pill className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>কোনো ওষুধ এন্ট্রি নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sorted.map((m) => (
                  <motion.div
                    key={m.id}
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
                            {formatDisplayDate(m.date)}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-rose-600">
                          {bnCurrency(m.amount)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {m.medicineName}
                        </p>
                        {m.problem && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {m.problem}
                          </div>
                        )}
                        {m.notes && (
                          <p className="text-xs text-muted-foreground">{m.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(m)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(m.id)}
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
