import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BroilerBatch, emptyBroilerBatch, BroilerBreed, BROILER_BREEDS } from '@/types/poultry';
import { getBroilerStats, bnCurrency, bnNum, toBn, BROILER_BENCHMARKS, gToKg, kgToG } from '@/lib/broilerCalculations';
import { Plus, Trash2, Check, Pencil, Sparkles, Info, Layers, History, Calendar, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';
import { HatcherySupplierSelect } from '@/components/poultry/HatcherySupplierSelect';

interface Props {
  batches: BroilerBatch[];
  activeBatchId?: string;
  onAdd: (b: BroilerBatch) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (batchId: string, fn: (b: BroilerBatch) => BroilerBatch) => void;
}

const defaultBreed: BroilerBreed = 'cobb_500';

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

const blankForm = (n: number, breed: BroilerBreed = defaultBreed) => {
  const bench = BROILER_BENCHMARKS[breed];
  return {
    name: `Batch B-${String(n).padStart(3, '0')}`,
    breed,
    arrivalDate: new Date().toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    initialCount: '',
    pricePerBird: '',
    purchaseCost: '',
    supplier: '',
    initialAvgWeightG: '40',
    targetSaleAgeDays: String(bench.saleAgeDays),
    targetSaleWeightG: String(bench.saleWeightG),
    targetFcr: String(bench.fcr),
    targetMortalityPct: String(bench.mortalityPct),
    notes: '',
  };
};

export function BroilerBatchManager({ batches, activeBatchId, onAdd, onSelect, onDelete, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm(batches.length + 1));

  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
  const activeStats = activeBatch ? getBroilerStats(activeBatch) : null;
  const activeBreedLabel = activeBatch ? (BROILER_BREEDS.find((x) => x.id === activeBatch.breed)?.label || activeBatch.breed) : '';

  const openNew = () => {
    setEditId(null);
    setForm(blankForm(batches.length + 1));
    setOpen(true);
  };

  const openEdit = (b: BroilerBatch) => {
    setEditId(b.id);
    const breed = b.breed || 'cobb_500';
    const bench = BROILER_BENCHMARKS[breed];
    setForm({
      name: b.name,
      breed,
      arrivalDate: b.arrivalDate,
      purchaseDate: b.purchaseDate || b.arrivalDate,
      initialCount: String(b.initialCount || ''),
      pricePerBird: b.pricePerBird ? String(b.pricePerBird) : '',
      purchaseCost: String(b.purchaseCost || ''),
      supplier: b.supplier || '',
      initialAvgWeightG: String(Math.round(kgToG(b.initialAvgWeight ?? 0.040))),
      targetSaleAgeDays: b.targetSaleAgeDays ? String(b.targetSaleAgeDays) : String(bench.saleAgeDays),
      targetSaleWeightG: b.targetSaleWeightG ? String(b.targetSaleWeightG) : String(bench.saleWeightG),
      targetFcr: b.targetFcr ? String(b.targetFcr) : String(bench.fcr),
      targetMortalityPct: b.targetMortalityPct ? String(b.targetMortalityPct) : String(bench.mortalityPct),
      notes: b.notes || '',
    });
    setOpen(true);
  };

  const applyBenchmarks = (breedKey: BroilerBreed) => {
    const bench = BROILER_BENCHMARKS[breedKey];
    setForm((f) => ({
      ...f,
      breed: breedKey,
      targetSaleAgeDays: String(bench.saleAgeDays),
      targetSaleWeightG: String(bench.saleWeightG),
      targetFcr: String(bench.fcr),
      targetMortalityPct: String(bench.mortalityPct),
    }));
    toast.info(`${BROILER_BREEDS.find((b) => b.id === breedKey)?.label} এর রেফারেন্স মান লোড করা হয়েছে`);
  };

  const updateChicksAndRate = (countStr: string, rateStr: string) => {
    const count = parseInt(countStr) || 0;
    const rate = parseFloat(rateStr) || 0;
    const cost = count > 0 && rate > 0 ? String(Math.round(count * rate)) : form.purchaseCost;
    setForm((f) => ({ ...f, initialCount: countStr, pricePerBird: rateStr, purchaseCost: cost }));
  };

  const save = () => {
    const initialCount = parseInt(form.initialCount) || 0;
    if (initialCount <= 0) return toast.error('বাচ্চার সংখ্যা দিন');

    const purchaseCost = parseFloat(form.purchaseCost) || 0;
    const pricePerBird = parseFloat(form.pricePerBird) || (initialCount > 0 ? purchaseCost / initialCount : undefined);
    const initialAvgWeightG = parseFloat(form.initialAvgWeightG) || 40;
    const targetSaleAgeDays = parseInt(form.targetSaleAgeDays) || undefined;
    const targetSaleWeightG = parseFloat(form.targetSaleWeightG) || undefined;
    const targetFcr = parseFloat(form.targetFcr) || undefined;
    const targetMortalityPct = parseFloat(form.targetMortalityPct) || undefined;

    if (editId) {
      if (onUpdate) {
        onUpdate(editId, (b) => ({
          ...b,
          name: form.name.trim() || b.name,
          breed: form.breed,
          arrivalDate: form.arrivalDate,
          purchaseDate: form.purchaseDate,
          initialCount,
          purchaseCost,
          pricePerBird,
          supplier: form.supplier || undefined,
          initialAvgWeight: gToKg(initialAvgWeightG),
          targetSaleAgeDays,
          targetSaleWeightG,
          targetFcr,
          targetMortalityPct,
          notes: form.notes || undefined,
        }));
      }
      toast.success('ব্যাচ তথ্য হালনাগাদ হয়েছে');
    } else {
      const b = emptyBroilerBatch({
        name: form.name.trim() || `Batch B-${String(batches.length + 1).padStart(3, '0')}`,
        breed: form.breed,
        arrivalDate: form.arrivalDate,
        purchaseDate: form.purchaseDate,
        initialCount,
        purchaseCost,
        pricePerBird,
        supplier: form.supplier || undefined,
        initialAvgWeight: gToKg(initialAvgWeightG),
        targetSaleAgeDays,
        targetSaleWeightG,
        targetFcr,
        targetMortalityPct,
        notes: form.notes || undefined,
      });
      onAdd(b);
      toast.success('নতুন ব্রয়লার ব্যাচ তৈরি হয়েছে');
    }

    setOpen(false);
    setEditId(null);
  };

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
              <Layers className="w-5 h-5 text-primary" />
              <span>ব্রয়লার ব্যাচ ব্যবস্থাপনা</span>
            </div>
            <Button
              size="sm"
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm"
              onClick={openNew}
            >
              <Plus className="w-4 h-4" />
              নতুন ব্যাচ
            </Button>
          </CardTitle>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'ব্যাচ সম্পাদনা' : 'নতুন ব্রয়লার ব্যাচ'}</DialogTitle>
                <DialogDescription>ব্রয়লারের জাত (Cobb 500, Ross 308), বাচ্চার সংখ্যা ও পারফরম্যান্স লক্ষ্যমাত্রা দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>ব্যাচের নাম</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>স্ট্রেন / জাত</Label>
                    <Select
                      value={form.breed}
                      onValueChange={(v: BroilerBreed) => applyBenchmarks(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="জাত বেছে নিন" />
                      </SelectTrigger>
                      <SelectContent>
                        {BROILER_BREEDS.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>বাচ্চা তোলার তারিখ</Label>
                    <Input
                      type="date"
                      value={form.arrivalDate}
                      onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>বাচ্চার সংখ্যা (টি)</Label>
                    <Input
                      type="number"
                      placeholder="যেমন: ১০০০"
                      value={form.initialCount}
                      onChange={(e) => updateChicksAndRate(e.target.value, form.pricePerBird)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>প্রতি বাচ্চার দর (৳)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="যেমন: ৫০"
                      value={form.pricePerBird}
                      onChange={(e) => updateChicksAndRate(form.initialCount, e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>মোট ক্রয় খরচ (৳)</Label>
                    <Input
                      type="number"
                      placeholder="যেমন: ৫০০০০"
                      value={form.purchaseCost}
                      onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                    />
                  </div>
                </div>

                <HatcherySupplierSelect
                  value={form.supplier}
                  onChange={(v) => setForm({ ...form, supplier: v })}
                />

                <div>
                  <Label>বাচ্চার গড় ওজন (গ্রাম)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="যেমন: ৪০"
                    value={form.initialAvgWeightG}
                    onChange={(e) => setForm({ ...form, initialAvgWeightG: e.target.value })}
                  />
                </div>

                {/* Targets / Benchmarks section */}
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1 text-primary">
                      <Sparkles className="w-3.5 h-3.5" /> পারফরম্যান্স লক্ষ্যমাত্রা (ঐচ্ছিক)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 text-primary"
                      onClick={() => applyBenchmarks(form.breed)}
                    >
                      রেফারেন্স লোড করুন
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3 text-muted-foreground shrink-0" />
                    {BROILER_BENCHMARKS[form.breed]?.referenceNote}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-xs">টার্গেট বিক্রির বয়স (দিন)</Label>
                      <Input
                        type="number"
                        value={form.targetSaleAgeDays}
                        onChange={(e) => setForm({ ...form, targetSaleAgeDays: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">টার্গেট ওজন (গ্রাম)</Label>
                      <Input
                        type="number"
                        value={form.targetSaleWeightG}
                        onChange={(e) => setForm({ ...form, targetSaleWeightG: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">টার্গেট FCR</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.targetFcr}
                        onChange={(e) => setForm({ ...form, targetFcr: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">সর্বোচ্চ মৃত্যুহার (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.targetMortalityPct}
                        onChange={(e) => setForm({ ...form, targetMortalityPct: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>মন্তব্য / নোট (ঐচ্ছিক)</Label>
                  <Textarea
                    placeholder="শেড নম্বর, ফ্লক সংক্রান্ত তথ্য..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={save}>
                  {editId ? 'হালনাগাদ করুন' : 'ব্যাচ তৈরি করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">সক্রিয় চলমান ব্যাচ</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {activeBatch ? activeBatch.name : 'কোনো ব্যাচ সক্রিয় নেই'}
              </p>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <span>মোট ব্যাচ: <strong className="text-foreground font-semibold">{toBn(batches.length)} টি</strong></span>
                {activeStats && (
                  <>
                    <span>•</span>
                    <span>জীবিত: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{bnNum(activeStats.liveBirds)} টি</strong></span>
                    <span>•</span>
                    <span>বয়স: <strong className="text-foreground font-semibold">{activeStats.ageFormattedBn}</strong></span>
                    {activeBreedLabel && (
                      <>
                        <span>•</span>
                        <span>জাত: <strong className="text-foreground font-semibold">{activeBreedLabel}</strong></span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* History / Batch List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <History className="w-4 h-4" />
                <span>ব্যাচ তালিকা ও হিস্ট্রি</span>
              </div>
              <span className="text-xs text-muted-foreground">
                মোট {toBn(batches.length)} টি
              </span>
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>এখনও কোনো ব্রয়লার ব্যাচ তৈরি করা হয়নি</p>
                <p className="text-xs mt-1">উপরে "+ নতুন ব্যাচ" এ চাপ দিন</p>
              </div>
            ) : (
              <AnimatePresence>
                {batches.map((b) => {
                  const s = getBroilerStats(b);
                  const isActive = b.id === activeBatchId;
                  const breedLabel = BROILER_BREEDS.find((x) => x.id === b.breed)?.label || b.breed || 'ব্রয়লার';

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => onSelect(b.id)}
                      className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                        isActive
                          ? 'border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-secondary/40 hover:bg-secondary/70 border-border/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5 flex-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-foreground">{b.name}</span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                              {breedLabel}
                            </span>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                <Check className="w-3 h-3" /> সক্রিয় ব্যাচ
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] px-2 rounded-lg border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelect(b.id);
                                }}
                              >
                                সক্রিয় করুন
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>তোলা: {formatDisplayDate(b.arrivalDate)}</span>
                            </div>
                            <span>•</span>
                            <span>বয়স: <b className="text-foreground">{s.ageFormattedBn}</b></span>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            প্রাথমিক: {bnNum(b.initialCount)} টি • জীবিত: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{bnNum(s.liveBirds)} টি</b>
                            {' '}• মৃত্যু: {bnNum(s.totalMortality)} টি
                            {s.soldBirds > 0 && ` • বিক্রি: ${bnNum(s.soldBirds)} টি`}
                          </div>

                          <div className="text-xs font-medium text-foreground">
                            মোট খরচ: <span className="text-amber-600 dark:text-amber-400 font-bold">{bnCurrency(s.totalCost)}</span>
                            {' '}• বিক্রি: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{bnCurrency(s.totalSales)}</span>
                            {s.latestAvgWeightG !== null && ` • বর্তমান গড় ওজন: ${bnNum(s.latestAvgWeightG, 0)} গ্রাম`}
                          </div>

                          {b.supplier && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>সরবরাহকারী: {b.supplier}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(b)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`আপনি কি "${b.name}" ব্যাচটি মুছে ফেলতে চান?`)) {
                                onDelete(b.id);
                                toast.success('ব্রয়লার ব্যাচ মুছে ফেলা হয়েছে');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
