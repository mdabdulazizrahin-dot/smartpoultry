import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CockBatch, emptyCockBatch } from '@/types/poultry';
import { getCockStats, bnCurrency, bnNum, toBn } from '@/lib/cockCalculations';
import { Plus, Trash2, Check, Pencil, Layers, History, Calendar, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';
import { HatcherySupplierSelect } from '@/components/poultry/HatcherySupplierSelect';

interface Props {
  batches: CockBatch[];
  activeBatchId?: string;
  onAdd: (b: CockBatch) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (batchId: string, fn: (b: CockBatch) => CockBatch) => void;
}

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

const blankForm = (n: number) => ({
  name: `Batch C-${String(n).padStart(3, '0')}`,
  arrivalDate: new Date().toISOString().split('T')[0],
  initialCount: '',
  pricePerBird: '',
  purchaseCost: '',
  supplier: '',
  breed: '',
  initialAvgWeightG: '',
  targetSaleAgeDays: '',
  targetSaleWeightG: '',
  targetFcr: '',
  targetMortalityPct: '',
  notes: '',
});

export function CockBatchManager({ batches, activeBatchId, onAdd, onSelect, onDelete, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm(batches.length + 1));

  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
  const activeStats = activeBatch ? getCockStats(activeBatch) : null;

  const openNew = () => {
    setEditId(null);
    setForm(blankForm(batches.length + 1));
    setOpen(true);
  };

  const openEdit = (b: CockBatch) => {
    setEditId(b.id);
    setForm({
      name: b.name,
      arrivalDate: b.arrivalDate,
      initialCount: String(b.initialCount || ''),
      pricePerBird: b.pricePerBird ? String(b.pricePerBird) : '',
      purchaseCost: String(b.purchaseCost || ''),
      supplier: b.supplier || '',
      breed: b.breed || '',
      initialAvgWeightG: b.initialAvgWeight ? String(Math.round(b.initialAvgWeight * 1000)) : '',
      targetSaleAgeDays: b.targetSaleAgeDays ? String(b.targetSaleAgeDays) : '',
      targetSaleWeightG: b.targetSaleWeightG ? String(b.targetSaleWeightG) : '',
      targetFcr: b.targetFcr ? String(b.targetFcr) : '',
      targetMortalityPct: b.targetMortalityPct ? String(b.targetMortalityPct) : '',
      notes: b.notes || '',
    });
    setOpen(true);
  };

  const count = parseInt(form.initialCount) || 0;
  const perBird = parseFloat(form.pricePerBird) || 0;
  const autoCost = perBird > 0 ? count * perBird : parseFloat(form.purchaseCost) || 0;

  const buildFields = () => ({
    name: form.name.trim(),
    arrivalDate: form.arrivalDate,
    initialCount: count,
    pricePerBird: perBird || undefined,
    purchaseCost: autoCost,
    supplier: form.supplier || undefined,
    breed: form.breed || undefined,
    initialAvgWeight: form.initialAvgWeightG ? parseFloat(form.initialAvgWeightG) / 1000 : undefined,
    targetSaleAgeDays: form.targetSaleAgeDays ? parseInt(form.targetSaleAgeDays) : undefined,
    targetSaleWeightG: form.targetSaleWeightG ? parseFloat(form.targetSaleWeightG) : undefined,
    targetFcr: form.targetFcr ? parseFloat(form.targetFcr) : undefined,
    targetMortalityPct: form.targetMortalityPct ? parseFloat(form.targetMortalityPct) : undefined,
    notes: form.notes || undefined,
  });

  const save = () => {
    if (!form.name.trim() || !form.initialCount) {
      toast.error('ব্যাচের নাম ও মুরগির সংখ্যা দিন');
      return;
    }
    if (editId && onUpdate) {
      onUpdate(editId, (b) => ({ ...b, ...buildFields() }));
      toast.success('ব্যাচ হালনাগাদ হয়েছে');
    } else {
      onAdd(emptyCockBatch(buildFields()));
      toast.success('নতুন ব্যাচ যোগ হয়েছে');
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
              <span>ককরেল / কক ব্যাচ ব্যবস্থাপনা</span>
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
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'ব্যাচ সম্পাদনা' : 'নতুন ককরেল / কক ব্যাচ'}</DialogTitle>
                <DialogDescription>ব্যাচের তথ্য, বাচ্চা সংখ্যা ও ক্রয়ের বিবরণ দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>ব্যাচের নাম</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>ক্রয়/আগমনের তারিখ</Label>
                    <Input type="date" value={form.arrivalDate} onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>প্রাথমিক বাচ্চার সংখ্যা</Label>
                    <Input type="number" placeholder="যেমন: ১০০০" value={form.initialCount} onChange={(e) => setForm({ ...form, initialCount: e.target.value })} />
                  </div>
                  <div>
                    <Label>প্রতি বাচ্চার দাম (৳)</Label>
                    <Input type="number" step="0.01" placeholder="যেমন: ৬" value={form.pricePerBird} onChange={(e) => setForm({ ...form, pricePerBird: e.target.value })} />
                  </div>
                </div>

                <div>
                  <Label>মোট ক্রয় মূল্য (৳)</Label>
                  <Input
                    type="number"
                    value={perBird > 0 ? String(autoCost) : form.purchaseCost}
                    readOnly={perBird > 0}
                    onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                  />
                  {perBird > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {bnNum(count)} × {bnCurrency(perBird)} = {bnCurrency(autoCost)}
                    </p>
                  )}
                </div>

                <HatcherySupplierSelect
                  value={form.supplier}
                  onChange={(v) => setForm({ ...form, supplier: v })}
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>জাত (ঐচ্ছিক)</Label>
                    <Input placeholder="ককরেল / লেয়ার মেল" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
                  </div>
                  <div>
                    <Label>প্রাথমিক গড় ওজন (গ্রাম)</Label>
                    <Input type="number" placeholder="৪০" value={form.initialAvgWeightG} onChange={(e) => setForm({ ...form, initialAvgWeightG: e.target.value })} />
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-secondary/30 space-y-2 mt-2">
                  <div className="text-xs font-semibold text-foreground">🎯 পারফরম্যান্স লক্ষ্যমাত্রা (ঐচ্ছিক)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">বিক্রির লক্ষ্য বয়স (দিন)</Label>
                      <Input type="number" placeholder="যেমন: ৭০" value={form.targetSaleAgeDays} onChange={(e) => setForm({ ...form, targetSaleAgeDays: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-[11px]">লক্ষ্য ওজন (গ্রাম)</Label>
                      <Input type="number" placeholder="যেমন: ১০০০" value={form.targetSaleWeightG} onChange={(e) => setForm({ ...form, targetSaleWeightG: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-[11px]">লক্ষ্য FCR</Label>
                      <Input type="number" step="0.01" placeholder="যেমন: ২.২০" value={form.targetFcr} onChange={(e) => setForm({ ...form, targetFcr: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-[11px]">লক্ষ্য মৃত্যুর হার (%)</Label>
                      <Input type="number" step="0.1" placeholder="যেমন: ৩.৫" value={form.targetMortalityPct} onChange={(e) => setForm({ ...form, targetMortalityPct: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Textarea placeholder="ব্যাচ সম্পর্কিত অতিরিক্ত তথ্য..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>

                <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={save}>
                  {editId ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
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
                    <span>বয়স: <strong className="text-foreground font-semibold">{bnNum(activeStats.ageDays)} দিন ({bnNum(activeStats.ageWeeks)} সপ্তাহ)</strong></span>
                    <span>•</span>
                    <span>বাচ্চা ক্রয়: <strong className="text-foreground font-semibold">{bnCurrency(activeStats.purchaseCost)}</strong></span>
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
                <p>কোনো ব্যাচ নেই — নতুন ব্যাচ যোগ করুন</p>
              </div>
            ) : (
              <AnimatePresence>
                {batches.map((b) => {
                  const s = getCockStats(b);
                  const active = b.id === activeBatchId;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => onSelect(b.id)}
                      className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                        active
                          ? 'border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-secondary/40 hover:bg-secondary/70 border-border/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5 flex-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-foreground">{b.name}</span>
                            {active ? (
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
                            {b.breed && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
                                {b.breed}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>আগমন: {formatDisplayDate(b.arrivalDate)}</span>
                            </div>
                            <span>•</span>
                            <span>বয়স: <b className="text-foreground">{bnNum(s.ageDays)} দিন</b> ({bnNum(s.ageWeeks)} সপ্তাহ)</span>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            জীবিত: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{bnNum(s.liveBirds)}</b> / {bnNum(b.initialCount)} টি
                            {' '}• বাচ্চা ক্রয়: <b className="text-foreground font-semibold">{bnCurrency(s.purchaseCost)}</b>
                            {b.pricePerBird ? ` (প্রতি ${bnCurrency(b.pricePerBird)})` : ''}
                          </div>

                          {b.supplier && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>সরবরাহকারী: {b.supplier}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {onUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(b)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(`"${b.name}" ব্যাচটি মুছে ফেলতে চান?`)) {
                                onDelete(b.id);
                                toast.success('ব্যাচ মুছে ফেলা হয়েছে');
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
