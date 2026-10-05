import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Package, Calendar, History } from 'lucide-react';
import { FeedPurchase, Dealer } from '@/types/farm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
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

interface FeedTrackerProps {
  feedPurchases: FeedPurchase[];
  dealers: Dealer[];
  onAddPurchase: (purchase: Omit<FeedPurchase, 'id' | 'totalAmount'>) => void;
  onEditPurchase: (id: string, purchase: Omit<FeedPurchase, 'id' | 'totalAmount'>) => void;
  onDeletePurchase: (id: string) => void;
}

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
};

const formatBengaliCurrency = (amount: number): string => {
  return `৳${toBengaliNumber(Math.round(amount))}`;
};

export function FeedTracker({ feedPurchases, dealers, onAddPurchase, onEditPurchase, onDeletePurchase }: FeedTrackerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<FeedPurchase | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bags, setBags] = useState('');
  const [pricePerBag, setPricePerBag] = useState('');
  const [dealerId, setDealerId] = useState<string>('none');
  const [notes, setNotes] = useState('');

  // Calculate totals
  const totalBags = feedPurchases.reduce((sum, p) => sum + p.bags, 0);
  const totalAmount = feedPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const sortedPurchases = [...feedPurchases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setBags('');
    setPricePerBag('');
    setDealerId('none');
    setNotes('');
    setEditingPurchase(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bagsNum = parseInt(bags);
    const priceNum = parseFloat(pricePerBag);
    
    if (bagsNum <= 0 || priceNum <= 0) return;

    const purchase = {
      date,
      bags: bagsNum,
      pricePerBag: priceNum,
      dealerId: dealerId === 'none' ? undefined : dealerId,
      notes: notes.trim() || undefined,
    };

    if (editingPurchase) {
      onEditPurchase(editingPurchase.id, purchase);
    } else {
      onAddPurchase(purchase);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const openEditDialog = (purchase: FeedPurchase) => {
    setEditingPurchase(purchase);
    setDate(purchase.date);
    setBags(purchase.bags.toString());
    setPricePerBag(purchase.pricePerBag.toString());
    setDealerId(purchase.dealerId || 'none');
    setNotes(purchase.notes || '');
    setIsDialogOpen(true);
  };

  const getDealerName = (id?: string) => dealers.find(d => d.id === id)?.name;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            খাদ্য হিসাব সারসংক্ষেপ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {toBengaliNumber(totalBags)}
              </div>
              <div className="text-xs text-muted-foreground">মোট বস্তা</div>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatBengaliCurrency(totalAmount)}
              </div>
              <div className="text-xs text-muted-foreground">মোট খরচ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <Plus className="w-4 h-4" />
            নতুন খাদ্য এন্ট্রি
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPurchase ? 'খাদ্য এন্ট্রি সম্পাদনা' : 'নতুন খাদ্য এন্ট্রি'}
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
              <Label htmlFor="bags">বস্তা সংখ্যা</Label>
              <Input
                id="bags"
                type="number"
                placeholder="যেমন: ১০"
                value={bags}
                onChange={(e) => setBags(e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerBag">প্রতি বস্তার দাম (৳)</Label>
              <Input
                id="pricePerBag"
                type="number"
                placeholder="যেমন: ২৫৮০"
                value={pricePerBag}
                onChange={(e) => setPricePerBag(e.target.value)}
                min="1"
                required
              />
            </div>

            {bags && pricePerBag && (
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <span className="text-sm text-muted-foreground">মোট: </span>
                <span className="text-lg font-bold text-primary">
                  {formatBengaliCurrency(parseInt(bags || '0') * parseFloat(pricePerBag || '0'))}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dealer">ডিলার (ঐচ্ছিক)</Label>
              <Select value={dealerId} onValueChange={setDealerId}>
                <SelectTrigger id="dealer">
                  <SelectValue placeholder="ডিলার নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">কোনো ডিলার নয় (নগদ)</SelectItem>
                  {dealers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dealerId !== 'none' && bags && pricePerBag && (
                <p className="text-xs text-warning">
                  এই পরিমাণ ডিলারের বকেয়াতে যোগ হবে
                </p>
              )}
            </div>

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
              {editingPurchase ? 'আপডেট করুন' : 'সেভ করুন'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            খাদ্য কেনার হিস্ট্রি
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>কোনো খাদ্য এন্ট্রি নেই</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {sortedPurchases.map((purchase) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(purchase.date), 'dd MMMM yyyy', { locale: bn })}
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">
                            {toBengaliNumber(purchase.bags)} বস্তা
                          </span>
                          <span className="text-muted-foreground mx-2">×</span>
                          <span className="text-muted-foreground">
                            ৳{toBengaliNumber(purchase.pricePerBag)}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-primary mt-1">
                          {formatBengaliCurrency(purchase.totalAmount)}
                        </div>
                        {getDealerName(purchase.dealerId) && (
                          <p className="text-xs text-purple-500 mt-1">🏪 {getDealerName(purchase.dealerId)} (বকেয়া)</p>
                        )}
                        {purchase.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{purchase.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(purchase)}
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
                                onClick={() => onDeletePurchase(purchase.id)}
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
