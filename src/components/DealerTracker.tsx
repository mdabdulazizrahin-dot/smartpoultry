import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Phone, CreditCard, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Dealer, DealerPayment, FeedPurchase } from '@/types/farm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DealerTrackerProps {
  dealers: Dealer[];
  feedPurchases: FeedPurchase[];
  totalPayments: number;
  onAddDealer: (dealer: Omit<Dealer, 'id' | 'payments'>) => void;
  onDeleteDealer: (id: string) => void;
  onUpdateOpeningDue: (dealerId: string, openingDue: number) => void;
  onUpdateBalanceType: (dealerId: string, balanceType: 'due' | 'advance') => void;
  onAddPayment: (dealerId: string, payment: Omit<DealerPayment, 'id'>) => void;
  onEditPayment: (dealerId: string, paymentId: string, payment: Omit<DealerPayment, 'id'>) => void;
  onDeletePayment: (dealerId: string, paymentId: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function DealerTracker({ dealers, feedPurchases, totalPayments, onAddDealer, onDeleteDealer, onUpdateOpeningDue, onUpdateBalanceType, onAddPayment, onEditPayment, onDeletePayment }: DealerTrackerProps) {
  const [isAddDealerOpen, setIsAddDealerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDueDialogOpen, setIsDueDialogOpen] = useState(false);
  const [dueDialogDealerId, setDueDialogDealerId] = useState<string | null>(null);
  const [dueDialogAmount, setDueDialogAmount] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<string | null>(null);
  const [expandedDealer, setExpandedDealer] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  
  const [dealerName, setDealerName] = useState('');
  const [dealerPhone, setDealerPhone] = useState('');
  const [dealerOpeningDue, setDealerOpeningDue] = useState('');
  const [dealerBalanceType, setDealerBalanceType] = useState<'due' | 'advance'>('due');
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddDealer = () => {
    if (dealerName) {
      const amt = parseFloat(dealerOpeningDue) || 0;
      onAddDealer({
        name: dealerName,
        phone: dealerPhone,
        openingDue: dealerBalanceType === 'advance' ? -amt : amt,
        balanceType: dealerBalanceType,
      });
      setDealerName('');
      setDealerPhone('');
      setDealerOpeningDue('');
      setDealerBalanceType('due');
      setIsAddDealerOpen(false);
    }
  };

  const openDueDialog = (dealerId: string, current: number) => {
    setDueDialogDealerId(dealerId);
    setDueDialogAmount(current ? current.toString() : '');
    setIsDueDialogOpen(true);
  };

  const handleSaveDue = () => {
    if (dueDialogDealerId) {
      const dealer = dealers.find(d => d.id === dueDialogDealerId);
      const feedTotal = getDealerFeedTotal(dueDialogDealerId);
      const paidTotal = dealer ? dealer.payments.reduce((s, p) => s + p.amount, 0) : 0;
      const desiredOutstanding = parseFloat(dueDialogAmount) || 0;
      const newOpening = desiredOutstanding - feedTotal + paidTotal;
      onUpdateOpeningDue(dueDialogDealerId, newOpening);
      setIsDueDialogOpen(false);
      setDueDialogDealerId(null);
      setDueDialogAmount('');
    }
  };

  // Calculate feed purchases total for a dealer
  const getDealerFeedTotal = (dealerId: string) => {
    return feedPurchases.filter(f => f.dealerId === dealerId).reduce((sum, f) => sum + f.totalAmount, 0);
  };

  const getDealerOutstanding = (dealer: Dealer) => {
    const opening = dealer.openingDue || 0;
    const feedTotal = getDealerFeedTotal(dealer.id);
    const paid = dealer.payments.reduce((sum, p) => sum + p.amount, 0);
    return opening + feedTotal - paid;
  };

  const handleAddPayment = () => {
    if (selectedDealer && paymentAmount) {
      if (isEditMode && editingPaymentId) {
        onEditPayment(selectedDealer, editingPaymentId, {
          amount: parseFloat(paymentAmount),
          date: paymentDate,
          notes: paymentNotes,
        });
      } else {
        onAddPayment(selectedDealer, {
          amount: parseFloat(paymentAmount),
          date: paymentDate,
          notes: paymentNotes,
        });
      }
      resetPaymentForm();
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentOpen(false);
    setIsEditMode(false);
    setEditingPaymentId(null);
  };

  const openPaymentDialog = (dealerId: string) => {
    setSelectedDealer(dealerId);
    setIsEditMode(false);
    setEditingPaymentId(null);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentOpen(true);
  };

  const openEditPaymentDialog = (dealerId: string, payment: DealerPayment) => {
    setSelectedDealer(dealerId);
    setIsEditMode(true);
    setEditingPaymentId(payment.id);
    setPaymentAmount(payment.amount.toString());
    setPaymentNotes(payment.notes || '');
    setPaymentDate(payment.date);
    setIsPaymentOpen(true);
  };

  // Calculate total payments for each dealer
  const getDealerTotalPayments = (dealer: Dealer) => {
    return dealer.payments.reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            ডিলার পেমেন্ট
          </CardTitle>
          <div className="flex gap-3 text-sm mt-1">
            <p className="text-muted-foreground">
              মোট পরিশোধ: <span className="text-success font-semibold">{formatCurrency(totalPayments)}</span>
            </p>
            <p className="text-muted-foreground">
              মোট বকেয়া: <span className="text-destructive font-semibold">{formatCurrency(dealers.reduce((sum, d) => sum + getDealerOutstanding(d), 0))}</span>
            </p>
          </div>
        </div>
        <Dialog open={isAddDealerOpen} onOpenChange={setIsAddDealerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              নতুন ডিলার
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন ডিলার যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>ডিলারের নাম</Label>
                <Input
                  placeholder="যেমন: আল-আমিন ফিড হাউস"
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ফোন নম্বর (ঐচ্ছিক)</Label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={dealerPhone}
                  onChange={(e) => setDealerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ব্যালেন্স টাইপ</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={dealerBalanceType === 'due' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setDealerBalanceType('due')}
                  >
                    বকেয়া
                  </Button>
                  <Button
                    type="button"
                    variant={dealerBalanceType === 'advance' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setDealerBalanceType('advance')}
                  >
                    অগ্রিম
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  এই ডিলারের সাথে সাধারণত কী থাকে সেটা বেছে নিন।
                </p>
              </div>
              <div className="space-y-2">
                <Label>{dealerBalanceType === 'advance' ? 'অগ্রিম' : 'বকেয়া'} (ঐচ্ছিক)</Label>
                <Input
                  type="number"
                  placeholder="০"
                  value={dealerOpeningDue}
                  onChange={(e) => setDealerOpeningDue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  বর্তমান {dealerBalanceType === 'advance' ? 'অগ্রিম' : 'বকেয়া'} থাকলে এখানে লিখুন। নতুন খাদ্য কিনলে বকেয়া বাড়বে, পেমেন্ট দিলে কমবে।
                </p>
              </div>
              <Button onClick={handleAddDealer} className="w-full mt-2">
                সেভ করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          <AnimatePresence>
            {dealers.map((dealer, index) => {
              const dealerTotal = getDealerTotalPayments(dealer);
              const outstanding = getDealerOutstanding(dealer);
              const feedTotal = getDealerFeedTotal(dealer.id);
              return (
                <motion.div
                  key={dealer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Collapsible
                    open={expandedDealer === dealer.id}
                    onOpenChange={(open) => setExpandedDealer(open ? dealer.id : null)}
                  >
                    <div className="border rounded-xl overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-500/10 p-2 rounded-lg">
                              <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-foreground">{dealer.name}</p>
                              {dealer.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{dealer.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right flex flex-col gap-1">
                              <div>
                                <p className="text-xs text-muted-foreground">মোট পরিশোধ</p>
                                <p className="text-sm font-semibold text-success">{formatCurrency(dealerTotal)}</p>
                              </div>
                              {(() => {
                                const isAdvance = dealer.balanceType === 'advance';
                                const label = isAdvance ? 'অগ্রিম' : 'বকেয়া';
                                const displayValue = isAdvance ? -outstanding : outstanding;
                                const colorClass = displayValue > 0
                                  ? (isAdvance ? 'text-success' : 'text-destructive')
                                  : (isAdvance ? 'text-destructive' : 'text-success');
                                return (
                                  <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className={`font-bold ${colorClass}`}>
                                      {formatCurrency(displayValue)}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                            {expandedDealer === dealer.id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t p-4 bg-muted/30 space-y-3">
                          <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground">মোট পরিশোধ</p>
                            <p className="text-sm font-semibold text-success">{formatCurrency(dealerTotal)}</p>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground">ব্যালেন্স টাইপ</p>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={dealer.balanceType !== 'advance' ? 'default' : 'outline'}
                                className="h-7 text-xs px-2"
                                onClick={() => onUpdateBalanceType(dealer.id, 'due')}
                              >
                                বকেয়া
                              </Button>
                              <Button
                                size="sm"
                                variant={dealer.balanceType === 'advance' ? 'default' : 'outline'}
                                className="h-7 text-xs px-2"
                                onClick={() => onUpdateBalanceType(dealer.id, 'advance')}
                              >
                                অগ্রিম
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">পেমেন্ট ইতিহাস</p>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => openDueDialog(dealer.id, outstanding)}
                              >
                                <Pencil className="w-3 h-3" />
                                বকেয়া এডিট
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1"
                                onClick={() => openPaymentDialog(dealer.id)}
                              >
                                <CreditCard className="w-3 h-3" />
                                পেমেন্ট দিন
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => onDeleteDealer(dealer.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {dealer.payments.length > 0 ? (
                            <div className="space-y-2">
                              {[...dealer.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment) => (
                                <div 
                                  key={payment.id} 
                                  className="flex items-center justify-between p-2 bg-background rounded-lg text-sm"
                                >
                                  <div>
                                    <p className="text-success font-medium">
                                      {formatCurrency(payment.amount)}
                                    </p>
                                    {payment.notes && (
                                      <p className="text-xs text-muted-foreground">{payment.notes}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(payment.date).toLocaleDateString('bn-BD')}
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                                      onClick={() => openEditPaymentDialog(dealer.id, payment)}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      onClick={() => onDeletePayment(dealer.id, payment.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              কোনো পেমেন্ট নেই
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {dealers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>কোনো ডিলার নেই। নতুন ডিলার যোগ করুন।</p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isPaymentOpen} onOpenChange={(open) => {
        setIsPaymentOpen(open);
        if (!open) resetPaymentForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'পেমেন্ট এডিট করুন' : 'পেমেন্ট দিন'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>পরিমাণ</Label>
              <Input
                type="number"
                placeholder="০"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>তারিখ</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>নোট (ঐচ্ছিক)</Label>
              <Input
                placeholder="যেমন: দ্বিতীয় কিস্তি"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleAddPayment} className="w-full mt-2">
              পেমেন্ট সেভ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDueDialogOpen} onOpenChange={setIsDueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>বকেয়া এডিট</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>বর্তমান বকেয়া (৳)</Label>
              <Input
                type="number"
                placeholder="০"
                value={dueDialogAmount}
                onChange={(e) => setDueDialogAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                এখন যে টাকা বকেয়া আছে সেটা লিখুন। নতুন খাদ্য কিনলে যোগ হবে, পেমেন্ট দিলে বাদ যাবে।
              </p>
            </div>
            <Button onClick={handleSaveDue} className="w-full">সেভ করুন</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
