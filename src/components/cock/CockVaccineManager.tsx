import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CockBatch, CockVaccine } from '@/types/poultry';
import { getCockStats, bnNum, toBn } from '@/lib/cockCalculations';
import { Plus, Trash2, Check, RotateCcw, Edit2, Calendar, Syringe, History, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: CockBatch;
  onUpdate: (fn: (b: CockBatch) => CockBatch) => void;
}

const DEFAULT_SCHEDULE: { name: string; day: number }[] = [
  { name: 'ND (BCRDV) ১ম ডোজ', day: 3 },
  { name: 'গামবোরো ১ম ডোজ', day: 10 },
  { name: 'গামবোরো ২য় ডোজ', day: 17 },
  { name: 'ND (BCRDV) ২য় ডোজ', day: 24 },
  { name: 'ফাউল পক্স', day: 35 },
  { name: 'ND (RDV) বুস্টার', day: 60 },
];

const addDays = (date: string, days: number) => {
  const d = new Date(date || new Date().toISOString().split('T')[0]);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

export function CockVaccineManager({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', day: '', plannedDate: '' });
  const s = getCockStats(batch);

  const openNew = () => { setEditId(null); setForm({ name: '', day: '', plannedDate: '' }); setOpen(true); };
  const openEdit = (v: CockVaccine) => {
    setEditId(v.id);
    setForm({ name: v.name, day: String(v.recommendedAgeDays ?? ''), plannedDate: v.plannedDate || '' });
    setOpen(true);
  };

  const loadDefaults = () => {
    onUpdate((b) => ({
      ...b,
      vaccines: [
        ...b.vaccines,
        ...DEFAULT_SCHEDULE.filter((d) => !b.vaccines.some((v) => v.name === d.name)).map((d) => ({
          id: crypto.randomUUID(),
          name: d.name,
          recommendedAgeDays: d.day,
          plannedDate: addDays(b.arrivalDate, d.day),
          status: 'pending' as const,
        })),
      ],
    }));
    toast.success('সাধারণ সময়সূচি যোগ হয়েছে');
  };

  const save = () => {
    if (!form.name.trim()) return toast.error('ভ্যাকসিনের নাম দিন');
    const day = parseInt(form.day) || 0;
    onUpdate((b) => ({
      ...b,
      vaccines: editId
        ? b.vaccines.map((v) =>
            v.id === editId
              ? { ...v, name: form.name.trim(), recommendedAgeDays: day, plannedDate: form.plannedDate || addDays(b.arrivalDate, day) }
              : v
          )
        : [
            ...b.vaccines,
            {
              id: crypto.randomUUID(),
              name: form.name.trim(),
              recommendedAgeDays: day,
              plannedDate: form.plannedDate || addDays(b.arrivalDate, day),
              status: 'pending',
            },
          ],
    }));
    setOpen(false);
    setEditId(null);
    setForm({ name: '', day: '', plannedDate: '' });
    toast.success(editId ? 'ভ্যাকসিন হালনাগাদ হয়েছে' : 'ভ্যাকসিন যোগ হয়েছে');
  };

  const setStatus = (id: string, status: CockVaccine['status']) =>
    onUpdate((b) => ({
      ...b,
      vaccines: b.vaccines.map((v) =>
        v.id === id
          ? { ...v, status, completedDate: status === 'done' ? new Date().toISOString().split('T')[0] : undefined }
          : v
      ),
    }));

  const remove = (id: string) => onUpdate((b) => ({ ...b, vaccines: b.vaccines.filter((v) => v.id !== id) }));

  const today = new Date().toISOString().split('T')[0];
  const sorted = [...batch.vaccines].sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
  const doneCount = sorted.filter((v) => v.status === 'done').length;

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
              <Syringe className="w-5 h-5 text-primary" />
              ভ্যাকসিন শিডিউল
            </div>
            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm" onClick={openNew}>
              <Plus className="w-4 h-4" />
              যোগ করুন
            </Button>
          </CardTitle>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { setEditId(null); setForm({ name: '', day: '', plannedDate: '' }); }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editId ? 'ভ্যাকসিন সম্পাদনা' : 'নতুন ভ্যাকসিন যোগ'}</DialogTitle>
                <DialogDescription>ভ্যাকসিনের নাম ও দেওয়ার নির্ধারিত দিন দিন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label>ভ্যাকসিনের নাম</Label>
                  <Input placeholder="যেমন: ND (BCRDV)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>মুরগির বয়স (দিন)</Label>
                  <Input type="number" placeholder="যেমন: ৭ বা ১৪" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
                </div>
                <div>
                  <Label>নির্ধারিত তারিখ (ঐচ্ছিক)</Label>
                  <Input type="date" value={form.plannedDate} onChange={(e) => setForm({ ...form, plannedDate: e.target.value })} />
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
          <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-violet-500/10 border border-violet-200/50 dark:border-violet-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">ভ্যাকসিন অগ্রগতি</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight">
                {toBn(doneCount)} / {toBn(sorted.length)} সম্পন্ন
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                বর্তমান বয়স: {toBn(s.ageDays)} দিন • পেন্ডিং: {toBn(sorted.length - doneCount)} টি
              </p>
            </div>
          </div>

          {batch.vaccines.length === 0 && (
            <Button variant="outline" size="sm" className="w-full rounded-xl py-2.5 h-auto text-xs sm:text-sm font-semibold border-primary/40 text-primary hover:bg-primary/5" onClick={loadDefaults}>
              সাধারণ ভ্যাকসিন সময়সূচি যুক্ত করুন
            </Button>
          )}

          {/* History / Schedule List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" />
              ভ্যাকসিন তালিকা
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Syringe className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>কোনো ভ্যাকসিন শিডিউল নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {sorted.map((v) => {
                  const due = v.status === 'pending' && v.plannedDate <= today;
                  const isDone = v.status === 'done';

                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`rounded-xl p-3.5 border transition-colors ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : due
                          ? 'bg-rose-500/10 border-rose-500/40 shadow-xs'
                          : 'bg-secondary/50 hover:bg-secondary/70 border-border/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                              <Calendar className="w-3.5 h-3.5 text-sky-600" />
                              <span>{formatDisplayDate(v.plannedDate)}</span>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : due
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {isDone ? '✓ সম্পন্ন' : due ? '⚠️ সময় হয়েছে' : '⏳ বাকি'}
                            </span>
                          </div>
                          <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                            {v.name}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-900">
                              বয়স: {toBn(v.recommendedAgeDays)} দিন
                            </span>
                            {isDone && v.completedDate && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                                ✓ দেওয়া হয়েছে: {formatDisplayDate(v.completedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isDone ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setStatus(v.id, 'pending')}
                              title="পুনরায় পেন্ডিং করুন"
                            >
                              <RotateCcw className="w-4 h-4 text-amber-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/15"
                              onClick={() => setStatus(v.id, 'done')}
                              title="সম্পন্ন মার্ক করুন"
                            >
                              <Check className="w-4 h-4 font-extrabold text-emerald-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(v)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => remove(v.id)}
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
