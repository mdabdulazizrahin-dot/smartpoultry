import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CockBatch, emptyCockBatch } from '@/types/poultry';
import { getCockStats, bnCurrency, bnNum, toBn } from '@/lib/cockCalculations';
import { Plus, Trash2, Check, Pencil } from 'lucide-react';
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

  const openNew = () => { setEditId(null); setForm(blankForm(batches.length + 1)); setOpen(true); };
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">🐓 ব্যাচ ব্যবস্থাপনা</CardTitle>
        <Button size="sm" className="gap-1" onClick={openNew}>
          <Plus className="w-4 h-4" /> নতুন ব্যাচ
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'ব্যাচ সম্পাদনা' : 'নতুন ব্যাচ'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>ব্যাচের নাম</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>ক্রয়/আগমনের তারিখ</Label><Input type="date" value={form.arrivalDate} onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })} /></div>
              <div><Label>প্রাথমিক সংখ্যা</Label><Input type="number" value={form.initialCount} onChange={(e) => setForm({ ...form, initialCount: e.target.value })} /></div>
              <div><Label>প্রতি বাচ্চার দাম (৳)</Label><Input type="number" step="0.01" value={form.pricePerBird} onChange={(e) => setForm({ ...form, pricePerBird: e.target.value })} /></div>
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
              <div><Label>জাত (ঐচ্ছিক)</Label><Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></div>
              <div><Label>প্রাথমিক গড় ওজন (গ্রাম)</Label><Input type="number" value={form.initialAvgWeightG} onChange={(e) => setForm({ ...form, initialAvgWeightG: e.target.value })} /></div>

              <div className="pt-1 text-sm font-semibold">🎯 লক্ষ্যমাত্রা (ঐচ্ছিক)</div>
              <div><Label>বিক্রির লক্ষ্য বয়স (দিন)</Label><Input type="number" value={form.targetSaleAgeDays} onChange={(e) => setForm({ ...form, targetSaleAgeDays: e.target.value })} /></div>
              <div><Label>লক্ষ্য ওজন (গ্রাম)</Label><Input type="number" value={form.targetSaleWeightG} onChange={(e) => setForm({ ...form, targetSaleWeightG: e.target.value })} /></div>
              <div><Label>লক্ষ্য FCR</Label><Input type="number" step="0.01" value={form.targetFcr} onChange={(e) => setForm({ ...form, targetFcr: e.target.value })} /></div>
              <div><Label>লক্ষ্য মৃত্যুর হার (%)</Label><Input type="number" step="0.1" value={form.targetMortalityPct} onChange={(e) => setForm({ ...form, targetMortalityPct: e.target.value })} /></div>

              <div><Label>নোট (ঐচ্ছিক)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={save}>সংরক্ষণ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {batches.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">কোনো ব্যাচ নেই — নতুন ব্যাচ যোগ করুন</p>
        )}
        {batches.map((b) => {
          const s = getCockStats(b);
          const active = b.id === activeBatchId;
          return (
            <div
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {active && <Check className="w-4 h-4 text-primary" />}
                    {b.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    আগমন: {toBn(b.arrivalDate)} • বয়স {bnNum(s.ageDays)} দিন ({bnNum(s.ageWeeks)} সপ্তাহ)
                  </div>
                  <div className="text-xs mt-1">
                    জীবিত: <b>{bnNum(s.liveBirds)}</b> / {bnNum(b.initialCount)} • ক্রয়: {bnCurrency(s.purchaseCost)}
                    {b.pricePerBird ? ` (প্রতি ${bnCurrency(b.pricePerBird)})` : ''}
                  </div>
                  {(b.supplier || b.breed) && (
                    <div className="text-xs text-muted-foreground">
                      {b.supplier ? `সরবরাহকারী: ${b.supplier}` : ''}{b.supplier && b.breed ? ' • ' : ''}{b.breed ? `জাত: ${b.breed}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex">
                  {onUpdate && (
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(b); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onDelete(b.id); toast.success('ব্যাচ মুছে ফেলা হয়েছে'); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
