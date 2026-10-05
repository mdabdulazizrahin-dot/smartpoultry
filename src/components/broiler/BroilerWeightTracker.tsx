import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BroilerBatch } from '@/types/poultry';
import { getBroilerStats, bnNum, toBn, gToKg } from '@/lib/broilerCalculations';
import { Plus, Trash2, Edit2, Scale, Calendar, History, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  batch: BroilerBatch;
  onUpdate: (fn: (b: BroilerBatch) => BroilerBatch) => void;
}

const blank = () => ({
  date: new Date().toISOString().split('T')[0],
  sampleBirds: '20',
  totalSampleWeightG: '',
  notes: '',
});

const formatDisplayDate = (d: string) => {
  try {
    return format(parseISO(d), 'd MMMM yyyy', { locale: bn });
  } catch {
    return toBn(d);
  }
};

export function BroilerWeightTracker({ batch, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());
  const s = getBroilerStats(batch);

  const openNew = () => {
    setEditId(null);
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (w: BroilerBatch['weights'][number]) => {
    setEditId(w.id);
    setForm({
      date: w.date,
      sampleBirds: String(w.sampleBirds),
      totalSampleWeightG: String(Math.round(w.totalSampleWeight * 1000)),
      notes: w.notes || '',
    });
    setOpen(true);
  };

  const sampleBirdsNum = parseInt(form.sampleBirds) || 0;
  const totalSampleGNum = parseFloat(form.totalSampleWeightG) || 0;
  const previewAvg = sampleBirdsNum > 0 ? totalSampleGNum / sampleBirdsNum : 0;

  const save = () => {
    if (sampleBirdsNum <= 0 || totalSampleGNum <= 0) {
      return toast.error('নমুনা পাখির সংখ্যা ও মোট ওজন (গ্রামে) দিন');
    }
    const totalKg = gToKg(totalSampleGNum);
    const record = {
      id: editId || crypto.randomUUID(),
      date: form.date,
      sampleBirds: sampleBirdsNum,
      totalSampleWeight: totalKg,
      avgWeight: totalKg / sampleBirdsNum,
      notes: form.notes.trim() || undefined,
    };

    onUpdate((b) => ({
      ...b,
      weights: editId
        ? b.weights.map((w) => (w.id === editId ? record : w))
        : [...b.weights, record],
    }));

    setOpen(false);
    setEditId(null);
    setForm(blank());
    toast.success(editId ? 'ওজন রেকর্ড হালনাগাদ হয়েছে' : 'ওজন রেকর্ড সংরক্ষিত');
  };

  const remove = (id: string) => {
    onUpdate((b) => ({ ...b, weights: b.weights.filter((w) => w.id !== id) }));
    toast.success('ওজন রেকর্ড মুছে ফেলা হয়েছে');
  };

  const chartData = (s.weightHistory || []).map((r) => ({
    date: r.record.date.slice(5),
    'গড় ওজন (গ্রাম)': Math.round(r.avgG),
    ...(s.targetWeightG ? { 'স্ট্যান্ডার্ড লক্ষ্য': Math.round(s.targetWeightG) } : {}),
  }));

  const rows = [...(s.weightHistory || [])].reverse();

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
              <Scale className="w-5 h-5 text-primary" />
              গড় ওজন ও বৃদ্ধি
            </div>
            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-9 px-3.5 shadow-sm" onClick={openNew}>
              <Plus className="w-4 h-4" />
              ওজন এন্ট্রি
            </Button>
          </CardTitle>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) { setEditId(null); setForm(blank()); }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{editId ? 'ওজন রেকর্ড সম্পাদনা' : 'নতুন ওজন এন্ট্রি (নমুনা)'}</DialogTitle>
                <DialogDescription>নমুনা মুরগি ও মোট ওজনের হিসাব দিন</DialogDescription>
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
                  <Label>নমুনা মুরগির সংখ্যা</Label>
                  <Input
                    type="number"
                    placeholder="যেমন: ১০ বা ২০"
                    value={form.sampleBirds}
                    onChange={(e) => setForm({ ...form, sampleBirds: e.target.value })}
                  />
                </div>
                <div>
                  <Label>মোট নমুনা ওজন (গ্রাম)</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="যেমন: ৩২০০"
                    value={form.totalSampleWeightG}
                    onChange={(e) => setForm({ ...form, totalSampleWeightG: e.target.value })}
                  />
                </div>
                <div>
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Input
                    placeholder="মন্তব্য..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-center text-xs">
                  গড় ওজন প্রতি মুরগি: <b className="text-sky-600 font-bold">{toBn(Math.round(previewAvg))} গ্রাম</b>
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
          <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-sky-500/10 border border-sky-200/50 dark:border-sky-900/30 rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">বর্তমান গড় ওজন</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
                {s.latestAvgWeightG ? `${toBn(Math.round(s.latestAvgWeightG))} গ্রাম` : '০ গ্রাম'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {s.weightGainG !== null && `দৈনিক বৃদ্ধি: +${toBn(Math.round(s.weightGainG))} গ্রাম • `}
                বয়স: {toBn(s.ageDays)} দিন ({toBn(s.ageWeeks)} সপ্তাহ)
              </p>
            </div>
          </div>

          {/* Growth Chart */}
          {chartData.length >= 2 && (
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/40">
              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                ওজন বৃদ্ধির ট্রেন্ড
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="গড় ওজন (গ্রাম)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" />
              হিস্ট্রি
            </div>

            {rows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>কোনো ওজন রেকর্ড নেই</p>
              </div>
            ) : (
              <AnimatePresence>
                {rows.map((r) => (
                  <motion.div
                    key={r.record.id}
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
                            {formatDisplayDate(r.record.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                            {toBn(Math.round(r.avgG))} গ্রাম
                          </p>
                          {r.gainG !== null && (
                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                              +{toBn(Math.round(r.gainG))} গ্রাম
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          নমুনা: {toBn(r.record.sampleBirds)} টি মুরগি (মোট {toBn(Math.round(r.totalG))} গ্রাম)
                        </p>
                        {r.record.notes && (
                          <p className="text-xs text-muted-foreground">{r.record.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(r.record)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(r.record.id)}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
