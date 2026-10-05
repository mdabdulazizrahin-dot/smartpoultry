import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Egg, Calendar, History, TrendingUp, Percent } from 'lucide-react';
import { EggProduction } from '@/types/farm';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EggProductionTrackerProps {
  eggProductions: EggProduction[];
  liveChickenCount: number;
  onAddProduction: (production: Omit<EggProduction, 'id' | 'productionRate'>) => void;
  onEditProduction: (id: string, production: Omit<EggProduction, 'id' | 'productionRate'>) => void;
  onDeleteProduction: (id: string) => void;
}

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

export function EggProductionTracker({
  eggProductions,
  liveChickenCount,
  onAddProduction,
  onEditProduction,
  onDeleteProduction,
}: EggProductionTrackerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<EggProduction | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eggsCollected, setEggsCollected] = useState('');
  const [notes, setNotes] = useState('');

  const sortedProductions = [...eggProductions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate averages
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  const thisMonthProductions = eggProductions.filter(p =>
    isWithinInterval(parseISO(p.date), { start: monthStart, end: monthEnd })
  );

  const dailyAvgRate = eggProductions.length > 0
    ? eggProductions.reduce((sum, p) => sum + p.productionRate, 0) / eggProductions.length
    : 0;

  const monthlyAvgRate = thisMonthProductions.length > 0
    ? thisMonthProductions.reduce((sum, p) => sum + p.productionRate, 0) / thisMonthProductions.length
    : 0;

  const todayProduction = sortedProductions[0];

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setEggsCollected('');
    setNotes('');
    setEditingProduction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eggsNum = parseInt(eggsCollected);
    if (eggsNum < 0) return;

    const production = {
      date,
      eggsCollected: eggsNum,
      notes: notes.trim() || undefined,
    };

    if (editingProduction) {
      onEditProduction(editingProduction.id, production);
    } else {
      onAddProduction(production);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const openEditDialog = (production: EggProduction) => {
    setEditingProduction(production);
    setDate(production.date);
    setEggsCollected(production.eggsCollected.toString());
    setNotes(production.notes || '');
    setIsDialogOpen(true);
  };

  // Calculate preview rate
  const previewRate = eggsCollected && liveChickenCount > 0
    ? (parseInt(eggsCollected) / liveChickenCount) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Egg className="w-5 h-5 text-primary" />
            ডিম উৎপাদন সারসংক্ষেপ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {toBengaliNumber(liveChickenCount)}
              </div>
              <div className="text-xs text-muted-foreground">জীবিত মুরগি</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-success">
                {toBengaliNumber(Math.round(dailyAvgRate))}%
              </div>
              <div className="text-xs text-muted-foreground">সার্বিক গড়</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {toBengaliNumber(Math.round(monthlyAvgRate))}%
              </div>
              <div className="text-xs text-muted-foreground">এই মাসের গড়</div>
            </div>
          </div>

          {todayProduction && todayProduction.date === format(new Date(), 'yyyy-MM-dd') && (
            <div className="mt-3 p-3 bg-success/10 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">আজকের উৎপাদন</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xl font-bold">
                  {toBengaliNumber(todayProduction.eggsCollected)} ডিম
                </span>
                <span className="text-lg text-success font-medium">
                  ({toBengaliNumber(Math.round(todayProduction.productionRate))}%)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2" disabled={liveChickenCount === 0}>
            <Plus className="w-4 h-4" />
            আজকের ডিম এন্ট্রি
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduction ? 'ডিম এন্ট্রি সম্পাদনা' : 'নতুন ডিম এন্ট্রি'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">তারিখ</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eggsCollected">ডিম সংখ্যা</Label>
              <Input
                id="eggsCollected"
                type="number"
                placeholder="যেমন: ৯৬০"
                value={eggsCollected}
                onChange={(e) => setEggsCollected(e.target.value)}
                min="0"
                required
              />
            </div>

            {previewRate > 0 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    উৎপাদন হার:
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {toBengaliNumber(Math.round(previewRate))}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {toBengaliNumber(parseInt(eggsCollected || '0'))} ÷ {toBengaliNumber(liveChickenCount)} × ১০০
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">নোট (ঐচ্ছিক)</Label>
              <Textarea
                id="notes"
                placeholder="অতিরিক্ত তথ্য..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full">
              {editingProduction ? 'আপডেট করুন' : 'সেভ করুন'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {liveChickenCount === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          ⚠️ প্রথমে "মৃত্যু" ট্যাবে মোট মুরগির সংখ্যা দিন
        </p>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            ডিম উৎপাদন হিস্ট্রি
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedProductions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Egg className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>কোনো ডিম উৎপাদন এন্ট্রি নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sortedProductions.map((production) => (
                  <motion.div
                    key={production.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(production.date), 'dd MMMM yyyy', { locale: bn })}
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="font-medium text-lg">
                            {toBengaliNumber(production.eggsCollected)} ডিম
                          </span>
                          <span className={`flex items-center gap-1 font-bold ${
                            production.productionRate >= 80 ? 'text-success' :
                            production.productionRate >= 60 ? 'text-warning' : 'text-destructive'
                          }`}>
                            <TrendingUp className="w-4 h-4" />
                            {toBengaliNumber(Math.round(production.productionRate))}%
                          </span>
                        </div>
                        {production.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{production.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(production)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>মুছে ফেলতে চান?</AlertDialogTitle>
                              <AlertDialogDescription>
                                এই এন্ট্রিটি স্থায়ীভাবে মুছে যাবে।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteProduction(production.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                মুছুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
