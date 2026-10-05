import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BroilerBatch, BROILER_FEED_TYPES, BroilerFeedType } from '@/types/poultry';
import { getBroilerStats, bnCurrency, bnNum, toBn } from '@/lib/broilerCalculations';
import { Plus, Trash2, Minus, Edit2, Calendar, History, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: BroilerBatch;
  onUpdate: (fn: (b: BroilerBatch) => BroilerBatch) => void;
}

const blankPurchase = () => ({
  date: new Date().toISOString().split('T')[0],
  feedType: 'starter' as BroilerFeedType,
  bags: '',
  bagSizeKg: '50',
  pricePerBag: '',
  notes: '',
});

const blankUsage = () => ({
  date: new Date().toISOString().split('T')[0],
  feedType: 'starter' as BroilerFeedType,
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

export function BroilerFeedTracker({ batch, onUpdate }: Props) {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState<string | null>(null);
  const [editUsageId, setEditUsageId] = useState<string | null>(null);
  const [pForm, setPForm] = useState(blankPurchase());
  const [uForm, setUForm] = useState(blankUsage());
  const [activeTab, setActiveTab] = useState<'purchase' | 'usage'>('purchase');
  const s = getBroilerStats(batch);

  const openNewPurchase = () => {
    setEditPurchaseId(null);
    setPForm(blankPurchase());
    setPurchaseOpen(true);
  };

  const openEditPurchase = (f: BroilerBatch['feed'][number]) => {
    setEditPurchaseId(f.id);
    setPForm({
      date: f.date,
      feedType: f.feedType,
      bags: String(f.bags),
      bagSizeKg: String(f.bagSizeKg),
      pricePerBag: String(f.pricePerBag),
      notes: f.notes || '',
    });
    setPurchaseOpen(true);
  };

  const openNewUsage = () => {
    setEditUsageId(null);
    setUForm(blankUsage());
    setUsageOpen(true);
  };

  const openEditUsage = (f: NonNullable<BroilerBatch['feedConsumption']>[number]) => {
    setEditUsageId(f.id);
    setUForm({
      date: f.date,
      feedType: f.feedType,
      quantityKg: String(f.quantityKg),
      notes: f.notes || '',
    });
    setUsageOpen(true);
  };

  const savePurchase = () => {
    const bags = parseInt(pForm.bags) || 0;
    const bagSizeKg = parseFloat(pForm.bagSizeKg) || 50;
    const pricePerBag = parseFloat(pForm.pricePerBag) || 0;

    if (bags <= 0) return toast.error('বস্তার সংখ্যা দিন');
    if (pricePerBag <= 0) return toast.error('প্রতি বস্তার মূল্য দিন');

    const totalKg = bags * bagSizeKg;
    const totalCost = bags * pricePerBag;

    const entry = {
      id: editPurchaseId || crypto.randomUUID(),
      date: pForm.date,
      feedType: pForm.feedType,
      bags,
      bagSizeKg,
      pricePerBag,
      totalKg,
      totalCost,
      notes: pForm.notes || undefined,
    };

    onUpdate((b) => ({
      ...b,
      feed: editPurchaseId
        ? b.feed.map((x) => (x.id === editPurchaseId ? entry : x))
        : [...b.feed, entry],
    }));
    setPurchaseOpen(false);
    setEditPurchaseId(null);
    setPForm(blankPurchase());
    toast.success(editPurchaseId ? 'ক্রয় রেকর্ড হালনাগাদ হয়েছে' : 'খাদ্য ক্রয় রেকর্ড সংরক্ষিত');
  };

  const saveUsage = () => {
    const quantityKg = parseFloat(uForm.quantityKg) || 0;
    if (quantityKg <= 0) return toast.error('খাদ্যের পরিমাণ (কেজি) দিন');

    const entry = {
      id: editUsageId || crypto.randomUUID(),
      date: uForm.date,
      feedType: uForm.feedType,
      quantityKg,
      notes: uForm.notes || undefined,
    };

    onUpdate((b) => {
      const list = b.feedConsumption || [];
      return {
        ...b,
        feedConsumption: editUsageId
          ? list.map((x) => (x.id === editUsageId ? entry : x))
          : [...list, entry],
      };
    });
    setUsageOpen(false);
    setEditUsageId(null);
    setUForm(blankUsage());
    toast.success(editUsageId ? 'ব্যবহার রেকর্ড হালনাগাদ হয়েছে' : 'দৈনিক খাদ্য খরচ সংরক্ষিত');
  };

  const removePurchase = (id: string) => {
    onUpdate((b) => ({ ...b, feed: b.feed.filter((f) => f.id !== id) }));
    toast.success('খাদ্য ক্রয় রেকর্ড মুছে ফেলা হয়েছে');
  };

  const removeUsage = (id: string) => {
    onUpdate((b) => ({
      ...b,
      feedConsumption: (b.feedConsumption || []).filter((f) => f.id !== id),
    }));
    toast.success('খাদ্য ব্যবহারের রেকর্ড মুছে ফেলা হয়েছে');
  };

  const sortedUsage = [...(batch.feedConsumption || [])].sort((a, b) => b.date.localeCompare(a.date));
  const sortedPurchases = [...(batch.feed || [])].sort((a, b) => b.date.localeCompare(a.date));

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
              <Button size="sm" variant="outline" className="gap-1 rounded-xl text-xs sm:text-sm h-9 px-3" onClick={openNewUsage}>
                <Minus className="w-4 h-4" />
                ব্যবহার
              </Button>
              <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm" onClick={openNewPurchase}>
                <Plus className="w-4 h-4" />
                ক্রয়
              </Button>
            </div>
          </CardTitle>

          {/* Purchase Dialog */}
          <Dialog open={purchaseOpen} onOpenChange={(isOpen) => {
            setPurchaseOpen(isOpen);
            if (!isOpen) { setEditPurchaseId(null); setPForm(blankPurchase()); }
          }}>
            <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editPurchaseId ? 'খাদ্য ক্রয় সম্পাদনা' : 'নতুন খাদ্য ক্রয়'}</DialogTitle>
                <DialogDescription>খাদ্যের বস্তা ও খরচের বিবরণ দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input
                    type="date"
                    value={pForm.date}
                    onChange={(e) => setPForm({ ...pForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>খাদ্যের ধরন</Label>
                  <Select
                    value={pForm.feedType}
                    onValueChange={(v: BroilerFeedType) => setPForm({ ...pForm, feedType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {BROILER_FEED_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>বস্তা সংখ্যা</Label>
                  <Input
                    type="number"
                    placeholder="যেমন: ১০"
                    value={pForm.bags}
                    onChange={(e) => setPForm({ ...pForm, bags: e.target.value })}
                  />
                </div>
                <div>
                  <Label>প্রতি বস্তার ওজন (কেজি)</Label>
                  <Input
                    type="number"
                    placeholder="৫০"
                    value={pForm.bagSizeKg}
                    onChange={(e) => setPForm({ ...pForm, bagSizeKg: e.target.value })}
                  />
                </div>
                <div>
                  <Label>প্রতি বস্তার মূল্য (টাকা)</Label>
                  <Input
                    type="number"
                    placeholder="যেমন: ২৬০০"
                    value={pForm.pricePerBag}
                    onChange={(e) => setPForm({ ...pForm, pricePerBag: e.target.value })}
                  />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea
                    placeholder="মন্তব্য..."
                    value={pForm.notes}
                    onChange={(e) => setPForm({ ...pForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button className="w-full mt-2" onClick={savePurchase}>
                  {editPurchaseId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Usage Dialog */}
          <Dialog open={usageOpen} onOpenChange={(isOpen) => {
            setUsageOpen(isOpen);
            if (!isOpen) { setEditUsageId(null); setUForm(blankUsage()); }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editUsageId ? 'খাদ্য ব্যবহার সম্পাদনা' : 'দৈনিক খাদ্য খরচ'}</DialogTitle>
                <DialogDescription>মুরগিকে খাওয়ানো খাদ্যের পরিমাণ দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>তারিখ</Label>
                  <Input
                    type="date"
                    value={uForm.date}
                    onChange={(e) => setUForm({ ...uForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>খাদ্যের ধরন</Label>
                  <Select
                    value={uForm.feedType}
                    onValueChange={(v: BroilerFeedType) => setUForm({ ...uForm, feedType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {BROILER_FEED_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>পরিমাণ (কেজি)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="যেমন: ২৫"
                    value={uForm.quantityKg}
                    onChange={(e) => setUForm({ ...uForm, quantityKg: e.target.value })}
                  />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea
                    placeholder="মন্তব্য..."
                    value={uForm.notes}
                    onChange={(e) => setUForm({ ...uForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-secondary text-center text-xs">
                  বর্তমান স্টক: <b className="text-foreground">{toBn(s.remainingFeedKg, 1)} কেজি</b>
                </div>
                <Button className="w-full mt-2" onClick={saveUsage}>
                  {editUsageId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
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
                মোট {toBn(s.totalBags, 2)} বস্তা ({toBn(s.totalFeedKg, 1)} কেজি) • FCR: {s.fcr ? toBn(s.fcr.toFixed(2)) : '০.০০'}
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
              ক্রয় হিস্ট্রি ({toBn(sortedPurchases.length)})
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`pb-2 transition-colors border-b-2 ${activeTab === 'usage' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              ব্যবহার হিস্ট্রি ({toBn(sortedUsage.length)})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'purchase' ? (
            <div className="space-y-2">
              {sortedPurchases.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">কোনো খাদ্য ক্রয় এন্ট্রি নেই</p>
                </div>
              ) : (
                <AnimatePresence>
                  {sortedPurchases.map((f) => (
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
                            {toBn(f.bags, 2)} বস্তা ({toBn(f.totalKg, 1)} কেজি) • {BROILER_FEED_TYPES.find(t => t.id === f.feedType)?.label || f.feedType}
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
                            onClick={() => openEditPurchase(f)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removePurchase(f.id)}
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
              {sortedUsage.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">কোনো খাদ্য ব্যবহার এন্ট্রি নেই</p>
                </div>
              ) : (
                <AnimatePresence>
                  {sortedUsage.map((f) => (
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
                          <p className="text-xs font-semibold text-muted-foreground">
                            ধরন: {BROILER_FEED_TYPES.find(t => t.id === f.feedType)?.label || f.feedType}
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
                            onClick={() => openEditUsage(f)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeUsage(f.id)}
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
