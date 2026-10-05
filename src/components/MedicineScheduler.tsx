import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Syringe, Calendar, Bell, Check, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MedicineSchedule } from '@/types/farm';
import { format, parseISO, differenceInDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import syringeIcon from '@/assets/syringe-icon.png';

interface MedicineSchedulerProps {
  schedules: MedicineSchedule[];
  reminderDays: number;
  onSetFirstDate: (id: string, date: string, notes?: string) => void;
  onMarkGiven: (id: string, date: string, notes?: string) => void;
  onResetStatus: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
};

export function MedicineScheduler({ 
  schedules, 
  reminderDays,
  onSetFirstDate, 
  onMarkGiven,
  onResetStatus,
  onUpdateNotes 
}: MedicineSchedulerProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<MedicineSchedule | null>(null);
  const [inputDate, setInputDate] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [dialogMode, setDialogMode] = useState<'set' | 'given'>('set');
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();

  const getStatusInfo = (schedule: MedicineSchedule) => {
    if (!schedule.nextDueDate) {
      return { status: 'not_set', label: 'তারিখ দিন', color: 'bg-muted text-muted-foreground' };
    }
    
    const daysUntilDue = differenceInDays(parseISO(schedule.nextDueDate), today);
    
    if (daysUntilDue < 0) {
      return { status: 'overdue', label: `${Math.abs(daysUntilDue)} দিন দেরি`, color: 'bg-destructive text-destructive-foreground' };
    } else if (daysUntilDue <= 3) {
      return { status: 'upcoming', label: daysUntilDue === 0 ? 'আজই!' : `${daysUntilDue} দিন বাকি`, color: 'bg-warning text-warning-foreground' };
    } else {
      return { status: 'scheduled', label: `${daysUntilDue} দিন বাকি`, color: 'bg-success/20 text-success' };
    }
  };

  const handleSetDate = () => {
    if (selectedSchedule && inputDate) {
      if (dialogMode === 'set') {
        onSetFirstDate(selectedSchedule.id, inputDate, inputNotes);
      } else {
        onMarkGiven(selectedSchedule.id, inputDate, inputNotes);
      }
      setIsOpen(false);
      setInputDate('');
      setInputNotes('');
      setSelectedSchedule(null);
    }
  };

  const openDialog = (schedule: MedicineSchedule, mode: 'set' | 'given') => {
    setSelectedSchedule(schedule);
    setDialogMode(mode);
    setInputDate(format(today, 'yyyy-MM-dd'));
    setInputNotes(schedule.notes || '');
    setIsOpen(true);
  };

  const getMedicineDescription = (type: string) => {
    switch (type) {
      case 'LASOTA': return 'প্রতি ৩০ দিন পর';
      case 'KIMI': return 'প্রতি ৪৫ দিন পর';
      case 'VACCINE': return 'প্রতি ৯০ দিন পর';
      default: return '';
    }
  };

  // Group vaccines together
  const vaccineSchedules = schedules.filter(s => s.type === 'VACCINE');
  const otherSchedules = schedules.filter(s => s.type !== 'VACCINE');

  // Get the most urgent status from vaccine schedules
  const getVaccineGroupStatus = () => {
    let mostUrgent = { status: 'not_set', label: 'তারিখ দিন', color: 'bg-muted text-muted-foreground', daysUntilDue: Infinity };
    
    for (const schedule of vaccineSchedules) {
      const statusInfo = getStatusInfo(schedule);
      if (statusInfo.status === 'overdue') {
        const daysUntilDue = schedule.nextDueDate ? differenceInDays(parseISO(schedule.nextDueDate), today) : Infinity;
        if (daysUntilDue < mostUrgent.daysUntilDue) {
          mostUrgent = { ...statusInfo, daysUntilDue };
        }
      } else if (statusInfo.status === 'upcoming' && mostUrgent.status !== 'overdue') {
        const daysUntilDue = schedule.nextDueDate ? differenceInDays(parseISO(schedule.nextDueDate), today) : Infinity;
        if (daysUntilDue < mostUrgent.daysUntilDue || mostUrgent.status === 'not_set') {
          mostUrgent = { ...statusInfo, daysUntilDue };
        }
      } else if (statusInfo.status === 'scheduled' && mostUrgent.status !== 'overdue' && mostUrgent.status !== 'upcoming') {
        const daysUntilDue = schedule.nextDueDate ? differenceInDays(parseISO(schedule.nextDueDate), today) : Infinity;
        if (daysUntilDue < mostUrgent.daysUntilDue || mostUrgent.status === 'not_set') {
          mostUrgent = { ...statusInfo, daysUntilDue };
        }
      }
    }
    return mostUrgent;
  };

  const renderScheduleItem = (schedule: MedicineSchedule, isVaccineGroup: boolean = false) => {
    const statusInfo = getStatusInfo(schedule);
    
    return (
      <div
        key={schedule.id}
        className={`rounded-lg p-3 border ${
          isVaccineGroup ? 'bg-background/50 border-border/50' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{schedule.name}</h4>
              <Badge className={statusInfo.color} variant="secondary">
                {statusInfo.status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {statusInfo.status === 'upcoming' && <Bell className="w-3 h-3 mr-1" />}
                {statusInfo.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                {statusInfo.label}
              </Badge>
            </div>
            
            {/* Notes input for medicine name */}
            <div className="mb-2">
              <Input
                type="text"
                placeholder="ওষুধের নাম লিখুন"
                value={schedule.notes || ''}
                onChange={(e) => onUpdateNotes(schedule.id, e.target.value)}
                className="text-sm h-8"
              />
            </div>
            
            {schedule.nextDueDate && (
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">শেষ দেওয়া: </span>
                  <span className="font-medium">
                    {format(parseISO(schedule.lastGivenDate), 'd MMM yyyy', { locale: bn })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">পরবর্তী: </span>
                  <span className="font-medium text-primary">
                    {format(parseISO(schedule.nextDueDate), 'd MMM yyyy', { locale: bn })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          {!schedule.nextDueDate ? (
            <Button 
              size="sm" 
              onClick={() => openDialog(schedule, 'set')}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-1" />
              প্রথম তারিখ দিন
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openDialog(schedule, 'given')}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1" />
              দেওয়া হয়েছে চিহ্নিত করুন
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Syringe className="w-5 h-5 text-primary" />
            ওষুধ ও ভ্যাকসিন শিডিউল
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            🔔 {toBengaliNumber(reminderDays)} দিন আগে রিমাইন্ডার পাবেন
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {/* Render non-vaccine schedules */}
            {otherSchedules.map((schedule, index) => {
              const statusInfo = getStatusInfo(schedule);
              
              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-xl p-4 border-2 ${
                    statusInfo.status === 'overdue' ? 'border-destructive bg-destructive/5' :
                    statusInfo.status === 'upcoming' ? 'border-warning bg-warning/5' :
                    statusInfo.status === 'scheduled' ? 'border-success/50 bg-success/5' :
                    'border-border bg-secondary/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{schedule.name}</h3>
                        <Badge className={statusInfo.color}>
                          {statusInfo.status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {statusInfo.status === 'upcoming' && <Bell className="w-3 h-3 mr-1" />}
                          {statusInfo.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getMedicineDescription(schedule.type)}
                      </p>
                      
                      {/* Notes input for medicine name */}
                      <div className="mb-2">
                        <Input
                          type="text"
                          placeholder="ওষুধের নাম লিখুন (যেমন: রাণীক্ষেত)"
                          value={schedule.notes || ''}
                          onChange={(e) => onUpdateNotes(schedule.id, e.target.value)}
                          className="text-sm h-8"
                        />
                      </div>
                      
                      {schedule.nextDueDate && (
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">শেষ দেওয়া: </span>
                            <span className="font-medium">
                              {format(parseISO(schedule.lastGivenDate), 'd MMM yyyy', { locale: bn })}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">পরবর্তী: </span>
                            <span className="font-medium text-primary">
                              {format(parseISO(schedule.nextDueDate), 'd MMM yyyy', { locale: bn })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {!schedule.nextDueDate ? (
                      <Button 
                        size="sm" 
                        onClick={() => openDialog(schedule, 'set')}
                        className="flex-1"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        প্রথম তারিখ দিন
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDialog(schedule, 'given')}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        দেওয়া হয়েছে চিহ্নিত করুন
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Render vaccine schedules grouped together */}
            {vaccineSchedules.length > 0 && (
              <motion.div
                key="vaccine-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: otherSchedules.length * 0.1 }}
                className={`rounded-xl p-4 border-2 ${
                  getVaccineGroupStatus().status === 'overdue' ? 'border-destructive bg-destructive/5' :
                  getVaccineGroupStatus().status === 'upcoming' ? 'border-warning bg-warning/5' :
                  getVaccineGroupStatus().status === 'scheduled' ? 'border-success/50 bg-success/5' :
                  'border-border bg-secondary/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <img src={syringeIcon} alt="Syringe" className="w-5 h-5" />
                  <h3 className="font-bold text-lg">VACCINE</h3>
                </div>
                
                <div className="space-y-3">
                  {vaccineSchedules
                    .filter((schedule) => schedule.name !== 'VACCINE')
                    .map((schedule) => renderScheduleItem(schedule, true))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>
                  {dialogMode === 'set' ? 'প্রথম তারিখ নির্ধারণ' : 'দেওয়ার তারিখ'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <p className="text-sm font-medium mb-2">{selectedSchedule?.name}</p>
                  <Input
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">ওষুধের নাম (ঐচ্ছিক)</p>
                  <Input
                    type="text"
                    placeholder="যেমন: রাণীক্ষেত, নিউক্যাসল"
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                  />
                </div>
                {dialogMode === 'given' && (
                  <p className="text-sm text-muted-foreground">
                    💡 দেরিতে দিলে পরবর্তী শিডিউল স্বয়ংক্রিয়ভাবে এডজাস্ট হবে
                  </p>
                )}
                <Button onClick={handleSetDate} className="w-full">
                  সংরক্ষণ করুন
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </motion.div>
  );
}
