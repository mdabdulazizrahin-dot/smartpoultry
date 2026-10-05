import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Check, Pencil, Trash2, Layers, History, Calendar, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
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

const formatDisplayDate = (d: string) => {
  if (!d) return '';
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

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

  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
  const activeSummary = activeBatch ? summaryOf(activeBatch) : null;

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
              <span>লেয়ার ব্যাচ ব্যবস্থাপনা</span>
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
                <DialogTitle>{editId ? 'ব্যাচের নাম ও তথ্য সম্পাদনা' : 'নতুন লেয়ার ব্যাচ'}</DialogTitle>
                <DialogDescription>
                  {editId ? 'ব্যাচের নাম বা সরবরাহকারী পরিবর্তন করুন' : 'নতুন ব্যাচ খালি অবস্থায় শুরু হবে, বর্তমান ব্যাচের তথ্য সংরক্ষিত থাকবে।'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>ব্যাচের নাম</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: ব্যাচ ১" />
                </div>
                <HatcherySupplierSelect
                  value={supplier}
                  onChange={setSupplier}
                />
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
                {activeSummary && (
                  <>
                    <span>•</span>
                    <span>জীবিত লেয়ার: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{toBn(activeSummary.live)} টি</strong></span>
                    {activeSummary.arrivalDate && (
                      <>
                        <span>•</span>
                        <span>আগমন: <strong className="text-foreground font-semibold">{formatDisplayDate(activeSummary.arrivalDate)}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span>ডিম বিক্রির এন্ট্রি: <strong className="text-foreground font-semibold">{toBn(activeSummary.sales)} টি</strong></span>
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
                <p>কোনো লেয়ার ব্যাচ নেই — নতুন ব্যাচ তৈরি করুন</p>
              </div>
            ) : (
              <AnimatePresence>
                {batches.map((b) => {
                  const s = summaryOf(b);
                  const active = b.id === activeBatchId;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => onSwitch(b.id)}
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
                                  onSwitch(b.id);
                                }}
                              >
                                সক্রিয় করুন
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{s.arrivalDate ? `আগমন: ${formatDisplayDate(s.arrivalDate)}` : 'আগমনের তারিখ দেওয়া নেই'}</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            জীবিত: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{toBn(s.live)}</b> / {toBn(s.initialCount)} টি
                            {' '}• ডিম বিক্রি এন্ট্রি: <b className="text-foreground font-semibold">{toBn(s.sales)}</b>
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
                            disabled={batches.length <= 1}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                            onClick={() => setDeleteId(b.id)}
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
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
    </motion.div>
  );
}
