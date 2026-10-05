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
import { Plus, Trash2, Minus, Edit2, Calendar, History, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: CockBatch;
  onUpdate: (fn: (b: CockBatch) => CockBatch) => void;
}

const blankBuy = () => ({
  date: new Date().toISOString().split('T')[0],
  feedType: '',
  bags: '',
  bagSizeKg: '50',
  pricePerBag: '',
  notes: '',
});

const blankUse = () => ({
  date: new Date().toISOString().split('T')[0],
  feedType: '',
  quantityKg: '',
  notes: '',
});

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

export function CockFeedTracker({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [useEditId, setUseEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankBuy());
  const [useForm, setUseForm] = useState(blankUse());
  const [activeTab, setActiveTab] = useState<'purchase' | 'usage'>('purchase');
  const s = getCockStats(batch);

  const openNew = () => { setEditId(null); setForm(blankBuy()); setOpen(true); };
  const openEdit = (f: CockBatch['feed'][number]) => {
    setEditId(f.id);
    setForm({
      date: f.date,
      feedType: f.feedType || '',
      bags: String(f.bags),
      bagSizeKg: String(f.bagSizeKg),
      pricePerBag: String(f.pricePerBag || ''),
      notes: f.notes || '',
    });
    setOpen(true);
  };

  const openNewUse = () => { setUseEditId(null); setUseForm(blankUse()); setUseOpen(true); };
  const openEditUse = (f: NonNullable<CockBatch['feedConsumption']>[number]) => {
    setUseEditId(f.id);
    setUseForm({
      date: f.date,
      feedType: f.feedType || '',
      quantityKg: String(f.quantityKg),
      notes: f.notes || '',
    });
    setUseOpen(true);
  };

  const save = () => {
    const bags = parseFloat(form.bags) || 0;
    const bagSizeKg = parseFloat(form.bagSizeKg) || 0;
    const pricePerBag = parseFloat(form.pricePerBag) || 0;
    if (bags <= 0 || bagSizeKg <= 0) return toast.error('বস্তার সংখ্যা ও ওজন দিন');
    const record = {
      id: editId || crypto.randomUUID(),
      date: form.date,
      feedType: form.feedType || undefined,
      bags,
      bagSizeKg,
      pricePerBag,
      totalKg: bags * bagSizeKg,
      totalCost: bags * pricePerBag,
      notes: form.notes || undefined,
    };
    onUpdate((b) => ({
      ...b,
      feed: editId ? b.feed.map((f) => (f.id === editId ? record : f)) : [...b.feed, record],
    }));
    setOpen(false);
    setEditId(null);
    setForm(blankBuy());
    toast.success(editId ? 'ক্রয় হালনাগাদ হয়েছে' : 'খাদ্য ক্রয় সংরক্ষিত');
  };

  const saveUse = () => {
    const quantityKg = parseFloat(useForm.quantityKg) || 0;
    if (quantityKg <= 0) return toast.error('ব্যবহৃত পরিমাণ (কেজি) দিন');
    const record = {
      id: useEditId || crypto.randomUUID(),
      date: useForm.date,
      feedType: useForm.feedType || undefined,
      quantityKg,
      notes: useForm.notes || undefined,
    };
    onUpdate((b) => {
      const list = b.feedConsumption || [];
      return {
        ...b,
        feedConsumption: useEditId ? list.map((f) => (f.id === useEditId ? record : f)) : [...list, record],
      };
    });
    setUseOpen(false);
    setUseEditId(null);
    setUseForm(blankUse());
    toast.success(useEditId ? 'ব্যবহার হালনাগাদ হয়েছে' : 'খাদ্য ব্যবহার সংরক্ষিত');
  };

  const remove = (id: string) => {
    onUpdate((b) => ({ ...b, feed: b.feed.filter((f) => f.id !== id) }));
    toast.success('ক্রয় রেকর্ড মুছে ফেলা হয়েছে');
  };

  const removeUse = (id: string) => {
    onUpdate((b) => ({
      ...b,
      feedConsumption: (b.feedConsumption || []).filter((f) => f.id !== id),
    }));
    toast.success('ব্যবহার রেকর্ড মুছে ফেলা হয়েছে');
  };

  const sorted = [...batch.feed].sort((a, b) => b.date.localeCompare(a.date));
  const usage = [...(batch.feedConsumption || [])].sort((a, b) => b.date.localeCompare(a.date));

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
              <Package className="w-5 h-5 text-primary" />
              খাদ্য ও স্টক
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1 rounded-xl text-xs sm:text-sm h-9 px-3" onClick={openNewUse}>
                <Minus className="w-4 h-4" />
                ব্যবহার
              </Button>
              <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm" onClick={openNew}>
                <Plus className="w-4 h-4" />
                ক্রয়
              </Button>
            </div>
          </CardTitle>

          {/* Buy Dialog */}
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { setEditId(null); setForm(blankBuy()); }
          }}>
            <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'খাদ্য ক্রয় সম্পাদনা' : 'নতুন খাদ্য ক্রয়'}</DialogTitle>
                <DialogDescription>খাদ্যের বস্তা ও খরচের হিসাব দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>খাদ্যের ধরন (ঐচ্ছিক)</Label>
                  <Input placeholder="স্টার্টার / গ্রোয়ার / ফিনিশার" value={form.feedType} onChange={(e) => setForm({ ...form, feedType: e.target.value })} />
                </div>
                <div>
                  <Label>বস্তার সংখ্যা</Label>
                  <Input type="number" step="0.01" placeholder="০" value={form.bags} onChange={(e) => setForm({ ...form, bags: e.target.value })} />
                </div>
                <div>
                  <Label>প্রতি বস্তা (কেজি)</Label>
                  <Input type="number" placeholder="৫০" value={form.bagSizeKg} onChange={(e) => setForm({ ...form, bagSizeKg: e.target.value })} />
                </div>
                <div>
                  <Label>প্রতি বস্তার দাম (৳)</Label>
                  <Input type="number" placeholder="০" value={form.pricePerBag} onChange={(e) => setForm({ ...form, pricePerBag: e.target.value })} />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea placeholder="মন্তব্য..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-center text-xs space-y-0.5">
                  <div>মোট পরিমাণ: <b className="text-foreground font-bold">{toBn((parseFloat(form.bags) || 0) * (parseFloat(form.bagSizeKg) || 0))} কেজি</b></div>
                  <div>মোট খরচ: <b className="text-amber-600 font-bold">{bnCurrency((parseFloat(form.bags) || 0) * (parseFloat(form.pricePerBag) || 0))}</b></div>
                </div>
                <Button className="w-full mt-2" onClick={save}>
                  {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Use Dialog */}
          <Dialog open={useOpen} onOpenChange={(isOpen) => {
            setUseOpen(isOpen);
            if (!isOpen) { setUseEditId(null); setUseForm(blankUse()); }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{useEditId ? 'খাদ্য ব্যবহার সম্পাদনা' : 'খাদ্য ব্যবহার এন্ট্রি'}</DialogTitle>
                <DialogDescription>মুরগিকে খাওয়ানো খাদ্যের পরিমাণ দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input type="date" value={useForm.date} onChange={(e) => setUseForm({ ...useForm, date: e.target.value })} />
                </div>
                <div>
                  <Label>খাদ্যের ধরন (ঐচ্ছিক)</Label>
                  <Input placeholder="স্টার্টার / গ্রোয়ার..." value={useForm.feedType} onChange={(e) => setUseForm({ ...useForm, feedType: e.target.value })} />
                </div>
                <div>
                  <Label>ব্যবহৃত পরিমাণ (কেজি)</Label>
                  <Input type="number" step="0.01" placeholder="০" value={useForm.quantityKg} onChange={(e) => setUseForm({ ...useForm, quantityKg: e.target.value })} />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea placeholder="মন্তব্য..." value={useForm.notes} onChange={(e) => setUseForm({ ...useForm, notes: e.target.value })} rows={2} />
                </div>
                <div className="p-2.5 rounded-lg bg-secondary text-center text-xs">
                  বর্তমান স্টক: <b className="text-foreground">{toBn(s.remainingFeedKg, 1)} কেজি</b>
                </div>
                <Button className="w-full mt-2" onClick={saveUse}>
                  {useEditId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">মোট খাদ্য খরচ</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {bnCurrency(s.feedCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                মোট {toBn(s.totalBags, 2)} বস্তা ({toBn(s.totalFeedKg, 1)} কেজি) • দৈনিক গড় {toBn(s.avgDailyFeedKg, 1)} কেজি
              </p>
            </div>
          </div>

          {/* 3-Column Stock Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-secondary/50 rounded-xl text-center border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">মোট ক্রয়</div>
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {toBn(s.totalFeedKg, 1)} কেজি
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-xl text-center border border-border/40">
              <div className="text-xs text-muted-foreground mb-1 font-medium">ব্যবহৃত</div>
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {toBn(s.feedConsumedKg, 1)} কেজি
              </div>
            </div>
            <div className={`p-3 rounded-xl text-center border ${s.remainingFeedKg < 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
              <div className="text-xs mb-1 font-medium">অবশিষ্ট স্টক</div>
              <div className="text-lg sm:text-xl font-bold">
                {toBn(s.remainingFeedKg, 1)} কেজি
              </div>
            </div>
          </div>

          {/* Toggle Tab for Purchase vs Usage */}
          <div className="flex border-b border-border/60 gap-4 pt-1 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('purchase')}
              className={`pb-2 transition-colors border-b-2 ${activeTab === 'purchase' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              ক্রয় হিস্ট্রি ({toBn(sorted.length)})
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`pb-2 transition-colors border-b-2 ${activeTab === 'usage' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              ব্যবহার হিস্ট্রি ({toBn(usage.length)})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'purchase' ? (
            <div className="space-y-2">
              {sorted.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">কোনো খাদ্য ক্রয় এন্ট্রি নেই</p>
                </div>
              ) : (
                <AnimatePresence>
                  {sorted.map((f) => (
                    <motion.div
                      key={f.id}
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
                              {formatDisplayDate(f.date)}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {bnCurrency(f.totalCost)}
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {toBn(f.bags, 2)} বস্তা ({toBn(f.totalKg, 1)} কেজি){f.feedType ? ` • ${f.feedType}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            প্রতি বস্তা {bnCurrency(f.pricePerBag)} ({toBn(f.bagSizeKg)} কেজি)
                          </p>
                          {f.notes && (
                            <p className="text-xs text-muted-foreground">{f.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(f)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => remove(f.id)}
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
          ) : (
            <div className="space-y-2">
              {usage.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">কোনো খাদ্য ব্যবহার এন্ট্রি নেই</p>
                </div>
              ) : (
                <AnimatePresence>
                  {usage.map((f) => (
                    <motion.div
                      key={f.id}
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
                              {formatDisplayDate(f.date)}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            {toBn(f.quantityKg, 1)} কেজি
                          </p>
                          {f.feedType && (
                            <p className="text-xs font-semibold text-muted-foreground">
                              ধরন: {f.feedType}
                            </p>
                          )}
                          {f.notes && (
                            <p className="text-xs text-muted-foreground">{f.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditUse(f)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeUse(f.id)}
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
