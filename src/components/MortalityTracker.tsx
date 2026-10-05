import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Skull, 
  Bird, 
  Plus, 
  Calendar, 
  TrendingDown,
  History,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MortalityRecord } from '@/types/farm';
import { toast } from 'sonner';

interface MortalityTrackerProps {
  initialCount: number;
  mortalityRecords: MortalityRecord[];
  onSetInitialCount: (count: number) => void;
  onAddMortality: (record: Omit<MortalityRecord, 'id'>) => void;
  onEditMortality: (id: string, record: Omit<MortalityRecord, 'id'>) => void;
  onDeleteMortality: (id: string) => void;
}

// Convert to Bengali numerals
const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
};

export function MortalityTracker({
  initialCount,
  mortalityRecords,
  onSetInitialCount,
  onAddMortality,
  onEditMortality,
  onDeleteMortality,
}: MortalityTrackerProps) {
  const [showInitialDialog, setShowInitialDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MortalityRecord | null>(null);
  
  const [inputCount, setInputCount] = useState(initialCount.toString());
  const [mortalityDate, setMortalityDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mortalityCount, setMortalityCount] = useState('');
  const [mortalityNotes, setMortalityNotes] = useState('');

  // Calculate totals
  const totalDeaths = mortalityRecords.reduce((sum, r) => sum + r.count, 0);
  const currentLiveCount = initialCount - totalDeaths;
  const mortalityRate = initialCount > 0 ? ((totalDeaths / initialCount) * 100).toFixed(1) : '0';

  const handleSaveInitialCount = () => {
    const count = parseInt(inputCount);
    if (count > 0) {
      onSetInitialCount(count);
      setShowInitialDialog(false);
      toast.success('মোট মুরগির সংখ্যা সেট হয়েছে');
    }
  };

  const handleAddMortality = () => {
    const count = parseInt(mortalityCount);
    if (count > 0 && count <= currentLiveCount) {
      if (editingRecord) {
        onEditMortality(editingRecord.id, {
          date: mortalityDate,
          count,
          notes: mortalityNotes || undefined,
        });
        toast.success('মৃত্যু রেকর্ড আপডেট হয়েছে');
      } else {
        onAddMortality({
          date: mortalityDate,
          count,
          notes: mortalityNotes || undefined,
        });
        toast.success('মৃত্যু রেকর্ড যোগ হয়েছে');
      }
      resetForm();
    } else if (count > currentLiveCount) {
      toast.error('মৃত্যু সংখ্যা জীবিত মুরগির চেয়ে বেশি হতে পারে না');
    }
  };

  const resetForm = () => {
    setMortalityDate(format(new Date(), 'yyyy-MM-dd'));
    setMortalityCount('');
    setMortalityNotes('');
    setEditingRecord(null);
    setShowAddDialog(false);
  };

  const handleEditRecord = (record: MortalityRecord) => {
    setEditingRecord(record);
    setMortalityDate(record.date);
    setMortalityCount(record.count.toString());
    setMortalityNotes(record.notes || '');
    setShowHistoryDialog(false);
    setShowAddDialog(true);
  };

  const handleDeleteRecord = (id: string) => {
    onDeleteMortality(id);
    toast.success('মৃত্যু রেকর্ড মুছে ফেলা হয়েছে');
  };

  // Sort records by date (newest first)
  const sortedRecords = [...mortalityRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold">মৃত্যু হিসাব</h3>
          </div>
        </div>

        {initialCount === 0 ? (
          <div className="text-center py-8">
            <Bird className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-3">
              প্রথমে মোট মুরগির সংখ্যা সেট করুন
            </p>
            <Button onClick={() => setShowInitialDialog(true)}>
              মোট সংখ্যা সেট করুন
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="p-3 bg-secondary/50 rounded-lg text-center cursor-pointer hover:bg-secondary/70 transition-colors"
                onClick={() => setShowInitialDialog(true)}
              >
                <div className="text-xs text-muted-foreground mb-1">শুরুতে</div>
                <div className="text-xl font-bold text-primary">
                  {toBengaliNumber(initialCount)}
                </div>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">মোট মৃত্যু</div>
                <div className="text-xl font-bold text-destructive">
                  {toBengaliNumber(totalDeaths)}
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">জীবিত</div>
                <div className="text-xl font-bold text-success">
                  {toBengaliNumber(currentLiveCount)}
                </div>
              </div>
            </div>

            {/* Mortality Rate */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">মৃত্যু হার</span>
              </div>
              <Badge variant={parseFloat(mortalityRate) > 5 ? 'destructive' : 'secondary'}>
                {mortalityRate}%
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddDialog(true)} 
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                মৃত্যু এন্ট্রি
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowHistoryDialog(true)}
                disabled={mortalityRecords.length === 0}
              >
                <History className="w-4 h-4" />
              </Button>
            </div>

            {/* Recent Deaths */}
            {sortedRecords.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  সাম্প্রতিক মৃত্যু
                </div>
                <AnimatePresence>
                  {sortedRecords.slice(0, 3).map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>{format(parseISO(record.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        -{toBengaliNumber(record.count)}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Initial Count Dialog */}
      <Dialog open={showInitialDialog} onOpenChange={setShowInitialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>মোট মুরগির সংখ্যা</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>শুরুতে কতগুলো মুরগি এনেছিলেন?</Label>
              <Input
                type="number"
                placeholder="যেমন: ১২০০"
                value={inputCount}
                onChange={(e) => setInputCount(e.target.value)}
                min="1"
              />
            </div>
            {initialCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  সংখ্যা পরিবর্তন করলে মৃত্যু হিসাব আপডেট হবে
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveInitialCount}>
              সেভ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Mortality Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'মৃত্যু রেকর্ড এডিট' : 'মৃত্যু এন্ট্রি'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>তারিখ</Label>
              <Input
                type="date"
                value={mortalityDate}
                onChange={(e) => setMortalityDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label>কতটি মারা গেছে?</Label>
              <Input
                type="number"
                placeholder="সংখ্যা লিখুন"
                value={mortalityCount}
                onChange={(e) => setMortalityCount(e.target.value)}
                min="1"
                max={currentLiveCount + (editingRecord?.count || 0)}
              />
              <p className="text-xs text-muted-foreground">
                বর্তমান জীবিত: {toBengaliNumber(currentLiveCount + (editingRecord?.count || 0))}
              </p>
            </div>
            <div className="space-y-2">
              <Label>নোট (ঐচ্ছিক)</Label>
              <Textarea
                placeholder="মৃত্যুর কারণ বা অন্য কোনো নোট..."
                value={mortalityNotes}
                onChange={(e) => setMortalityNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              বাতিল
            </Button>
            <Button onClick={handleAddMortality}>
              {editingRecord ? 'আপডেট' : 'সেভ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>মৃত্যু হিস্ট্রি</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {sortedRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                কোনো রেকর্ড নেই
              </p>
            ) : (
              sortedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(parseISO(record.date), 'dd/MM/yyyy')}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        -{toBengaliNumber(record.count)}
                      </Badge>
                    </div>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1 pl-5">
                        {record.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRecord(record)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecord(record.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
