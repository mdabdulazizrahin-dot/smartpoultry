import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Check, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FarmData, LayerBatch, LayerBatchSnapshot } from '@/types/farm';
import { HatcherySupplierSelect } from '@/components/poultry/HatcherySupplierSelect';

interface Props {
  batches: LayerBatch[];
  activeBatchId: string;
  farmData: FarmData;
  onAdd: (name: string, supplier?: string) => void;
  onSwitch: (id: string) => void;
  onRename: (id: string, name: string, supplier?: string) => void;
  onDelete: (id: string) => void;
}

const toBn = (v: string | number) =>
  String(v).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export function LayerBatchManager({ batches, activeBatchId, farmData, onAdd, onSwitch, onRename, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditId(null);
    setName(`ব্যাচ ${toBn(batches.length + 1)}`);
    setSupplier('');
    setOpen(true);
  };

  const openEdit = (b: LayerBatch) => {
    setEditId(b.id);
    setName(b.name);
    setSupplier(b.supplier || '');
    setOpen(true);
  };

  const save = () => {
    if (!name.trim()) {
      toast.error('ব্যাচের নাম দিন');
      return;
    }
    if (editId) {
      onRename(editId, name, supplier);
      toast.success('ব্যাচের নাম বদলেছে');
    } else {
      onAdd(name, supplier);
      toast.success('নতুন ব্যাচ তৈরি হয়েছে');
    }
    setOpen(false);
    setEditId(null);
    setSupplier('');
  };

  const summaryOf = (b: LayerBatch) => {
    const snap: LayerBatchSnapshot | undefined =
      b.id === activeBatchId
        ? {
            monthlyExpenses: farmData.monthlyExpenses,
            eggSales: farmData.eggSales,
            medicineSchedules: farmData.medicineSchedules,
            flockInfo: farmData.flockInfo || {
              arrivalDate: '', initialCount: 0, mortalityRecords: [], feedPurchases: [],
              eggProductions: [], medicinePurchases: [], miscExpenses: [],
            },
          }
        : b.data;
    const flock = snap?.flockInfo;
    const dead = (flock?.mortalityRecords || []).reduce((s, m) => s + m.count, 0);
    const live = Math.max((flock?.initialCount || 0) - dead, 0);
    return {
      arrivalDate: flock?.arrivalDate || '',
      initialCount: flock?.initialCount || 0,
      live,
      sales: snap?.eggSales.length || 0,
    };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">🐔 ব্যাচ ব্যবস্থাপনা</CardTitle>
        <Button size="sm" className="gap-1" onClick={openNew}>
          <Plus className="w-4 h-4" /> নতুন ব্যাচ
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          প্রতিটি ব্যাচের ডিম বিক্রি, খাদ্য, উৎপাদন, মৃত্যু, ওষুধ ও মাসিক খরচ আলাদা। ডিলার সব ব্যাচে একই থাকে।
        </p>
        {batches.map((b) => {
          const s = summaryOf(b);
          const active = b.id === activeBatchId;
          return (
            <div
              key={b.id}
              onClick={() => onSwitch(b.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {active && <Check className="w-4 h-4 text-primary" />}
                    {b.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.arrivalDate ? `আগমন: ${toBn(s.arrivalDate)}` : 'আগমনের তারিখ দেওয়া হয়নি'}
                    {b.supplier ? ` • সরবরাহকারী: ${b.supplier}` : ''}
                  </div>
                  <div className="text-xs mt-1">
                    জীবিত: <b className="font-number">{toBn(s.live)}</b> / <span className="font-number">{toBn(s.initialCount)}</span>
                    {' '}• বিক্রি এন্ট্রি: <span className="font-number">{toBn(s.sales)}</span>
                  </div>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(b); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={batches.length <= 1}
                    onClick={(e) => { e.stopPropagation(); setDeleteId(b.id); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? 'ব্যাচের নাম বদল' : 'নতুন ব্যাচ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ব্যাচের নাম</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <HatcherySupplierSelect
              value={supplier}
              onChange={setSupplier}
            />
            {!editId && (
              <p className="text-xs text-muted-foreground">
                নতুন ব্যাচ খালি অবস্থায় শুরু হবে। বর্তমান ব্যাচের সব হিসাব সংরক্ষিত থাকবে।
              </p>
            )}
            <Button className="w-full" onClick={save}>সংরক্ষণ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ব্যাচ মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই ব্যাচের সব হিসাব (ডিম বিক্রি, খাদ্য, উৎপাদন, মৃত্যু, ওষুধ, খরচ) স্থায়ীভাবে মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) { onDelete(deleteId); toast.success('ব্যাচ মুছে ফেলা হয়েছে'); }
                setDeleteId(null);
              }}
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
