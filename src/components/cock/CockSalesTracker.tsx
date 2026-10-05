import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CockBatch } from '@/types/poultry';
import { getCockStats, bnCurrency, bnNum, toBn } from '@/lib/cockCalculations';
import { Plus, Trash2, Edit2, Calendar, History, Banknote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: CockBatch;
  onUpdate: (fn: (b: CockBatch) => CockBatch) => void;
}

const blank = () => ({
  date: new Date().toISOString().split('T')[0],
  birds: '',
  totalWeightKg: '',
  pricePerKg: '',
  buyer: '',
  notes: '',
});

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

export function CockSalesTracker({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());
  const s = getCockStats(batch);

  const openNew = () => { setEditId(null); setForm(blank()); setOpen(true); };
  const openEdit = (x: CockBatch['sales'][number]) => {
    setEditId(x.id);
    setForm({
      date: x.date,
      birds: String(x.birds),
      totalWeightKg: String(x.totalWeightKg),
      pricePerKg: String(x.pricePerKg),
      buyer: x.buyer || '',
      notes: x.notes || '',
    });
    setOpen(true);
  };

  const save = () => {
    const birds = parseInt(form.birds) || 0;
    const totalWeightKg = parseFloat(form.totalWeightKg) || 0;
    const pricePerKg = parseFloat(form.pricePerKg) || 0;
    if (birds <= 0) return toast.error('মুরগির সংখ্যা দিন');
    const prev = editId ? batch.sales.find((x) => x.id === editId)?.birds || 0 : 0;
    if (birds - prev > s.liveBirds) return toast.error('জীবিত মুরগির চেয়ে বেশি বিক্রি করা যাবে না');
    if (totalWeightKg <= 0 || pricePerKg <= 0) return toast.error('ওজন ও দর দিন');
    const record = {
      id: editId || crypto.randomUUID(),
      date: form.date,
      birds,
      totalWeightKg,
      pricePerKg,
      totalAmount: totalWeightKg * pricePerKg,
      buyer: form.buyer || undefined,
      notes: form.notes || undefined,
    };
    onUpdate((b) => ({
      ...b,
      sales: editId ? b.sales.map((x) => (x.id === editId ? record : x)) : [...b.sales, record],
    }));
    setOpen(false);
    setEditId(null);
    setForm(blank());
    toast.success(editId ? 'বিক্রি হালনাগাদ হয়েছে' : 'বিক্রি সংরক্ষিত');
  };

  const remove = (id: string) => {
    onUpdate((b) => ({ ...b, sales: b.sales.filter((x) => x.id !== id) }));
    toast.success('বিক্রি রেকর্ড মুছে ফেলা হয়েছে');
  };

  const sorted = [...batch.sales].sort((a, b) => b.date.localeCompare(a.date));
  const totalSoldKg = sorted.reduce((sum, x) => sum + x.totalWeightKg, 0);

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
              <Banknote className="w-5 h-5 text-primary" />
              বিক্রি ট্র্যাকার
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
            <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'বিক্রি সম্পাদনা' : 'নতুন বিক্রি এন্ট্রি'}</DialogTitle>
                <DialogDescription>বিক্রিত মুরগি, ওজন ও মূল্যের বিবরণ দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>মুরগির সংখ্যা (বর্তমানে জীবিত {toBn(s.liveBirds)})</Label>
                  <Input type="number" placeholder="০" value={form.birds} onChange={(e) => setForm({ ...form, birds: e.target.value })} />
                </div>
                <div>
                  <Label>মোট জীবিত ওজন (কেজি)</Label>
                  <Input type="number" step="0.01" placeholder="০.০" value={form.totalWeightKg} onChange={(e) => setForm({ ...form, totalWeightKg: e.target.value })} />
                </div>
                <div>
                  <Label>প্রতি কেজি দর (৳)</Label>
                  <Input type="number" placeholder="০" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} />
                </div>
                <div>
                  <Label>ক্রেতা (ঐচ্ছিক)</Label>
                  <Input placeholder="যেমন: পাইকার / আড়তদার..." value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea placeholder="মন্তব্য..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-center text-xs">
                  মোট হিসাব: <b className="text-emerald-600 font-bold">{bnCurrency((parseFloat(form.totalWeightKg) || 0) * (parseFloat(form.pricePerKg) || 0))}</b>
                </div>
                <Button className="w-full mt-2" onClick={save}>
                  {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">মোট বিক্রি আয়</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {bnCurrency(s.totalSales)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                মোট {toBn(s.soldBirds)} টি মুরগি বিক্রি ({toBn(totalSoldKg.toFixed(1))} কেজি)
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
                <Banknote className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>কোনো বিক্রি এন্ট্রি নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sorted.map((x) => (
                  <motion.div
                    key={x.id}
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
                            {formatDisplayDate(x.date)}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {bnCurrency(x.totalAmount)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {toBn(x.birds)} টি মুরগি • {toBn(x.totalWeightKg)} কেজি (দর {bnCurrency(x.pricePerKg)}/কেজি)
                        </p>
                        {x.buyer && (
                          <p className="text-xs text-muted-foreground">ক্রেতা: {x.buyer}</p>
                        )}
                        {x.notes && (
                          <p className="text-xs text-muted-foreground">{x.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(x)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(x.id)}
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
