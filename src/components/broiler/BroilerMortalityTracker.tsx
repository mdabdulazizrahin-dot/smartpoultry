import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BroilerBatch, BROILER_MORTALITY_REASONS } from '@/types/poultry';
import { getBroilerStats, bnNum, toBn } from '@/lib/broilerCalculations';
import { Plus, Trash2, Edit2, Skull, Calendar, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: BroilerBatch;
  onUpdate: (fn: (b: BroilerBatch) => BroilerBatch) => void;
}

const blank = () => ({
  date: new Date().toISOString().split('T')[0],
  count: '',
  reason: 'অজানা',
  notes: '',
});

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'dd/MM/yyyy');
  } catch {
    return toBn(d);
  }
};

export function BroilerMortalityTracker({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());
  const s = getBroilerStats(batch);

  const openNew = () => {
    setEditId(null);
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (m: BroilerBatch['mortality'][number]) => {
    setEditId(m.id);
    setForm({
      date: m.date,
      count: String(m.count),
      reason: m.reason || 'অজানা',
      notes: m.notes || '',
    });
    setOpen(true);
  };

  const save = () => {
    const count = parseInt(form.count) || 0;
    if (count <= 0) return toast.error('মৃত মুরগির সংখ্যা দিন');
    const prev = editId ? batch.mortality.find((m) => m.id === editId)?.count || 0 : 0;
    if (count - prev > s.liveBirds) {
      return toast.error(`বর্তমানে জীবিত মুরগি ${toBn(s.liveBirds)} টি। এর চেয়ে বেশি মৃত্যু রেকর্ড করা যাবে না`);
    }

    const record = {
      id: editId || crypto.randomUUID(),
      date: form.date,
      count,
      reason: form.reason || undefined,
      notes: form.notes || undefined,
    };

    onUpdate((b) => ({
      ...b,
      mortality: editId
        ? b.mortality.map((m) => (m.id === editId ? record : m))
        : [...b.mortality, record],
    }));

    setOpen(false);
    setEditId(null);
    setForm(blank());
    toast.success(editId ? 'মৃত্যু রেকর্ড হালনাগাদ হয়েছে' : 'মৃত্যু রেকর্ড সংরক্ষিত');
  };

  const remove = (id: string) => {
    onUpdate((b) => ({ ...b, mortality: b.mortality.filter((m) => m.id !== id) }));
    toast.success('রেকর্ড মুছে ফেলা হয়েছে');
  };

  const sorted = [...(batch.mortality || [])].sort((a, b) => b.date.localeCompare(a.date));

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
              <Skull className="w-5 h-5 text-destructive" />
              মৃত্যু হিসাব
            </div>
            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm" onClick={openNew}>
              <Plus className="w-4 h-4" />
              মৃত্যু এন্ট্রি
            </Button>
          </CardTitle>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { setEditId(null); setForm(blank()); }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editId ? 'মৃত্যু রেকর্ড সম্পাদনা' : 'নতুন মৃত্যু এন্ট্রি'}</DialogTitle>
                <DialogDescription>মৃত মুরগির সংখ্যা ও কারণ উল্লেখ করুন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>মৃত মুরগির সংখ্যা (সর্বোচ্চ {toBn(s.liveBirds)})</Label>
                  <Input
                    type="number"
                    placeholder="০"
                    value={form.count}
                    onChange={(e) => setForm({ ...form, count: e.target.value })}
                  />
                </div>
                <div>
                  <Label>মৃত্যুর কারণ</Label>
                  <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {BROILER_MORTALITY_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea
                    value={form.notes}
                    placeholder="লক্ষণ বা অতিরিক্ত বিবরণ..."
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button className="w-full mt-2" onClick={save}>
                  {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 3-Column Stats Grid - Image 3 style */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-secondary/50 rounded-xl text-center border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">শুরুতে</div>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {toBn(batch.initialCount)}
              </div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-xl text-center border border-destructive/20">
              <div className="text-xs text-destructive mb-1 font-medium">মোট মৃত্যু</div>
              <div className="text-xl sm:text-2xl font-bold text-destructive">
                {toBn(s.totalMortality)}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-center border border-emerald-500/20">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-1 font-medium">জীবিত</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {toBn(s.liveBirds)}
              </div>
            </div>
          </div>

          {/* Mortality Rate Bar - Image 3 style */}
          <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl border border-border/40">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">মৃত্যু হার</span>
            </div>
            <Badge
              variant={s.mortalityRate > 5 ? 'destructive' : 'secondary'}
              className="bg-destructive text-white rounded-full px-3 py-0.5 text-xs font-bold"
            >
              {bnNum(s.mortalityRate, 1)}%
            </Badge>
          </div>

          {/* Action Button */}
          <Button
            onClick={openNew}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm gap-1.5 h-10 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            মৃত্যু এন্ট্রি
          </Button>

          {/* Recent Deaths - Image 3 style */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              সাম্প্রতিক মৃত্যু
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Skull className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">কোনো মৃত্যু রেকর্ড নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sorted.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-2.5 bg-secondary/40 hover:bg-secondary/60 transition-colors rounded-xl text-sm border border-border/40"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatDisplayDate(m.date)}</span>
                      {m.reason && (
                        <span className="text-xs text-muted-foreground">({m.reason})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="bg-destructive text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                        -{toBn(m.count)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(m)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(m.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
