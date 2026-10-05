import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bird, Clock, Edit2, Check, X } from 'lucide-react';
import { format, differenceInDays, differenceInWeeks, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

interface ChickenAgeTrackerProps {
  arrivalDate: string;
  onSetArrivalDate: (date: string) => void;
}

// Convert to Bengali numerals
const toBengaliNumber = (num: number): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
};

export function ChickenAgeTracker({ arrivalDate, onSetArrivalDate }: ChickenAgeTrackerProps) {
  const [isEditing, setIsEditing] = useState(!arrivalDate);
  const [inputDate, setInputDate] = useState(arrivalDate || format(new Date(), 'yyyy-MM-dd'));

  const handleSave = () => {
    if (inputDate) {
      onSetArrivalDate(inputDate);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputDate(arrivalDate || format(new Date(), 'yyyy-MM-dd'));
    setIsEditing(false);
  };

  // Calculate age
  const calculateAge = () => {
    if (!arrivalDate) return null;
    
    const arrival = parseISO(arrivalDate);
    const today = new Date();
    const totalDays = differenceInDays(today, arrival);
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    
    return { totalDays, weeks, remainingDays };
  };

  const age = calculateAge();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bird className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">মুরগির বয়স</h3>
        </div>
        {arrivalDate && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="arrivalDate">মুরগি আনার তারিখ</Label>
            <Input
              id="arrivalDate"
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Check className="w-4 h-4 mr-1" />
              সেভ করুন
            </Button>
            {arrivalDate && (
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      ) : age ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Current Week - Large Display */}
          <div className="text-center py-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <div className="text-5xl font-bold text-primary mb-2">
              {toBengaliNumber(age.weeks)}
            </div>
            <div className="text-lg text-muted-foreground">সপ্তাহ</div>
            {age.remainingDays > 0 && (
              <div className="text-sm text-muted-foreground mt-1">
                + {toBengaliNumber(age.remainingDays)} দিন
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="w-3 h-3" />
                আনার তারিখ
              </div>
              <div className="font-medium text-sm">
                {format(parseISO(arrivalDate), 'dd/MM/yyyy')}
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3" />
                মোট দিন
              </div>
              <div className="font-medium text-sm">
                {toBengaliNumber(age.totalDays)} দিন
              </div>
            </div>
          </div>

          {/* Week milestone badge */}
          {age.remainingDays === 0 && (
            <Badge className="w-full justify-center py-2 bg-success text-success-foreground">
              🎉 আজ {toBengaliNumber(age.weeks)} সপ্তাহ সম্পূর্ণ হয়েছে!
            </Badge>
          )}
        </motion.div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Bird className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>মুরগি আনার তারিখ সেট করুন</p>
          <Button 
            variant="outline" 
            className="mt-3"
            onClick={() => setIsEditing(true)}
          >
            তারিখ সেট করুন
          </Button>
        </div>
      )}
    </Card>
  );
}
