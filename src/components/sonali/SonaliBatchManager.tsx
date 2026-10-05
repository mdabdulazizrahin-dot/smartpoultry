import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SonaliBatch, emptySonaliBatch, SonaliBreed } from '@/types/poultry';
import { getSonaliStats, bnCurrency, bnNum, toBn, SONALI_BENCHMARKS } from '@/lib/sonaliCalculations';
import { Plus, Trash2, Check, Pencil, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { HatcherySupplierSelect } from '@/components/poultry/HatcherySupplierSelect';

interface Props {
  batches: SonaliBatch[];
  activeBatchId?: string;
  onAdd: (b: SonaliBatch) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (batchId: string, fn: (b: SonaliBatch) => SonaliBatch) => void;
}

const blankForm = (n: number) => ({
  name: `Batch S-${String(n).padStart(3, '0')}`,
  breed: 'সোনালি' as SonaliBreed,
  arrivalDate: new Date().toISOString().split('T')[0],
  purchaseDate: new Date().toISOString().split('T')[0],
  initialCount: '',
  pricePerBird: '',
  purchaseCost: '',
  supplier: '',
  initialAvgWeightG: '35', // 35 grams day-old chick
  targetSaleAgeDays: String(SONALI_BENCHMARKS.saleAgeDays),
  targetSaleWeightG: String(SONALI_BENCHMARKS.saleWeightG),
  targetFcr: String(SONALI_BENCHMARKS.fcr),
  targetMortalityPct: String(SONALI_BENCHMARKS.mortalityPct),
  notes: '',
});

export function SonaliBatchManager({ batches, activeBatchId, onAdd, onSelect, onDelete, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm(batches.length + 1));

  const openNew = () => {
    setEditId(null);
    setForm(blankForm(batches.length + 1));
    setOpen(true);
  };

  const openEdit = (b: SonaliBatch) => {
    setEditId(b.id);
    setForm({
      name: b.name,
      breed: b.breed || 'সোনালি',
      arrivalDate: b.arrivalDate,
      purchaseDate: b.purchaseDate || b.arrivalDate,
      initialCount: String(b.initialCount || ''),
      pricePerBird: b.pricePerBird ? String(b.pricePerBird) : '',
      purchaseCost: String(b.purchaseCost || ''),
      supplier: b.supplier || '',
      initialAvgWeightG: b.initialAvgWeight ? String(Math.round(b.initialAvgWeight * 1000)) : '35',
      targetSaleAgeDays: b.targetSaleAgeDays ? String(b.targetSaleAgeDays) : String(SONALI_BENCHMARKS.saleAgeDays),
      targetSaleWeightG: b.targetSaleWeightG ? String(b.targetSaleWeightG) : String(SONALI_BENCHMARKS.saleWeightG),
      targetFcr: b.targetFcr ? String(b.targetFcr) : String(SONALI_BENCHMARKS.fcr),
      targetMortalityPct: b.targetMortalityPct ? String(b.targetMortalityPct) : String(SONALI_BENCHMARKS.mortalityPct),
      notes: b.notes || '',
    });
    setOpen(true);
  };

  const applyBenchmarks = () => {
    setForm((prev) => ({
      ...prev,
      targetSaleAgeDays: String(SONALI_BENCHMARKS.saleAgeDays),
      targetSaleWeightG: String(SONALI_BENCHMARKS.saleWeightG),
      targetFcr: String(SONALI_BENCHMARKS.fcr),
      targetMortalityPct: String(SONALI_BENCHMARKS.mortalityPct),
    }));
    toast.info('গবেষণার সাধারণ রেফারেন্স মান বসানো হয়েছে (প্রয়োজনে পরিবর্তন করুন)');
  };

  const count = parseInt(form.initialCount) || 0;
  const perBird = parseFloat(form.pricePerBird) || 0;
  const autoCost = perBird > 0 ? count * perBird : parseFloat(form.purchaseCost) || 0;

  const buildFields = () => ({
    name: form.name.trim(),
    breed: form.breed,
    arrivalDate: form.arrivalDate,
    purchaseDate: form.purchaseDate || form.arrivalDate,
    initialCount: count,
    pricePerBird: perBird || undefined,
    purchaseCost: autoCost,
    supplier: form.supplier || undefined,
    initialAvgWeight: form.initialAvgWeightG ? parseFloat(form.initialAvgWeightG) / 1000 : 0.035,
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
      toast.success('ব্যাচ তথ্য হালনাগাদ হয়েছে');
    } else {
      onAdd(emptySonaliBatch(buildFields()));
      toast.success('নতুন সোনালি ব্যাচ যোগ হয়েছে');
    }
    setOpen(false);
    setEditId(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">🐣 সোনালি / মুনালি ব্যাচসমূহ</CardTitle>
        <Button size="sm" className="gap-1" onClick={openNew}>
          <Plus className="w-4 h-4" /> নতুন ব্যাচ
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            কোনো সোনালি ব্যাচ নেই। হিসাব শুরু করতে নতুন ব্যাচ তৈরি করুন।
          </p>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => {
              const s = getSonaliStats(b);
              const isActive = b.id === activeBatchId;
              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {b.name}
                        <span className="text-xs font-normal px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                          {b.breed || 'সোনালি'}
                        </span>
                        {isActive && (
                          <span className="text-[11px] font-medium text-primary flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> সক্রিয়
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        বয়স {s.ageFormattedBn} • জীবিত {bnNum(s.liveBirds)}/{bnNum(b.initialCount)} টি
                        {s.latestAvgWeightG !== null ? ` • গড় ওজন ${bnNum(s.latestAvgWeightG, 0)} গ্রাম` : ''}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        মোট খরচ: {bnCurrency(s.totalCost)} • বিক্রি: {bnCurrency(s.totalSales)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(b)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {!isActive && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onSelect(b.id)}>
                          নির্বাচন
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`"${b.name}" ব্যাচটি মুছে ফেলতে চান?`)) onDelete(b.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'ব্যাচ সম্পাদনা' : 'নতুন সোনালি / মুনালি ব্যাচ'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>ব্যাচের নাম / আইডি</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>জাত / ধরন</Label>
                  <Select
                    value={form.breed}
                    onValueChange={(v) => setForm({ ...form, breed: v as SonaliBreed })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="সোনালি">সোনালি (Sonali)</SelectItem>
                      <SelectItem value="মুনালি">মুনালি (Munali)</SelectItem>
                      <SelectItem value="সোনালি ক্লাসিক">সোনালি ক্লাসিক</SelectItem>
                      <SelectItem value="সোনালি হাইব্রিড">সোনালি হাইব্রিড</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>আগমনের তারিখ</Label>
                  <Input
                    type="date"
                    value={form.arrivalDate}
                    onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ক্রয়ের তারিখ</Label>
                  <Input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>প্রাথমিক বাচ্চার সংখ্যা</Label>
                  <Input
                    type="number"
                    value={form.initialCount}
                    onChange={(e) => setForm({ ...form, initialCount: e.target.value })}
                    placeholder="১০০০"
                  />
                </div>
                <div>
                  <Label>বাচ্চার প্রাথমিক গড় ওজন (গ্রাম)</Label>
                  <Input
                    type="number"
                    value={form.initialAvgWeightG}
                    onChange={(e) => setForm({ ...form, initialAvgWeightG: e.target.value })}
                    placeholder="৩৫"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>প্রতি বাচ্চার দর (৳)</Label>
                  <Input
                    type="number"
                    value={form.pricePerBird}
                    onChange={(e) => setForm({ ...form, pricePerBird: e.target.value })}
                    placeholder="৩৫"
                  />
                </div>
                <div>
                  <Label>মোট ক্রয় মূল্য (৳)</Label>
                  <Input
                    type="number"
                    value={form.pricePerBird && form.initialCount ? autoCost : form.purchaseCost}
                    onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                    placeholder="৩৫০০০"
                  />
                </div>
              </div>

              <HatcherySupplierSelect
                value={form.supplier}
                onChange={(v) => setForm({ ...form, supplier: v })}
              />

              {/* Targets / Benchmarks section */}
              <div className="p-3 rounded-lg border bg-secondary/30 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-foreground">🎯 পারফরম্যান্স লক্ষ্যমাত্রা (ঐচ্ছিক / পরিবর্তনযোগ্য)</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-primary hover:text-primary"
                    onClick={applyBenchmarks}
                  >
                    <Sparkles className="w-3 h-3" /> প্রস্তাবিত মান
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px]">বিক্রির লক্ষ্য বয়স (দিন)</Label>
                    <Input
                      type="number"
                      value={form.targetSaleAgeDays}
                      onChange={(e) => setForm({ ...form, targetSaleAgeDays: e.target.value })}
                      placeholder="৬৫"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">লক্ষ্য ওজন (গ্রাম)</Label>
                    <Input
                      type="number"
                      value={form.targetSaleWeightG}
                      onChange={(e) => setForm({ ...form, targetSaleWeightG: e.target.value })}
                      placeholder="৯০০"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">লক্ষ্য FCR</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.targetFcr}
                      onChange={(e) => setForm({ ...form, targetFcr: e.target.value })}
                      placeholder="২.৩০"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">লক্ষ্য মৃত্যুহার (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.targetMortalityPct}
                      onChange={(e) => setForm({ ...form, targetMortalityPct: e.target.value })}
                      placeholder="৪.০"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>নোট (ঐচ্ছিক)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ব্যাচ সম্পর্কিত অতিরিক্ত বিবরণ..."
                />
              </div>

              <Button className="w-full mt-2" onClick={save}>
                {editId ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
