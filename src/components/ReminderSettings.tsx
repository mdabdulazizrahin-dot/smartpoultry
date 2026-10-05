import { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { showAppNotification } from '@/lib/notifications';

interface ReminderSettingsProps {
  reminderDays: number;
  onChangeReminderDays: (days: number) => void;
}

export function ReminderSettings({ reminderDays, onChangeReminderDays }: ReminderSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState(reminderDays.toString());

  const handleSave = () => {
    onChangeReminderDays(parseInt(selectedDays));
    toast.success(`রিমাইন্ডার ${selectedDays} দিন আগে পাবেন`);
    setIsOpen(false);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('এই ব্রাউজারে নোটিফিকেশন সুবিধা নেই');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await showAppNotification('টেস্ট নোটিফিকেশন', {
          body: 'নোটিফিকেশন সফলভাবে চালু হয়েছে!',
          icon: '/icons/icon-192.png'
        });
        toast.success('নোটিফিকেশন চালু হয়েছে! 🔔');
      } else {
        toast.error('নোটিফিকেশন অনুমতি প্রয়োজন');
      }
    } catch (error) {
      console.warn('Notification permission failed:', error);
      toast.error('নোটিফিকেশন চালু করা যায়নি');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          রিমাইন্ডার সেটিংস
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            রিমাইন্ডার সেটিংস
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div>
            <p className="text-sm font-medium mb-4">কত দিন আগে রিমাইন্ডার চান?</p>
            <RadioGroup value={selectedDays} onValueChange={setSelectedDays}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer">
                <RadioGroupItem value="1" id="day-1" />
                <Label htmlFor="day-1" className="flex-1 cursor-pointer">১ দিন আগে</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer">
                <RadioGroupItem value="3" id="day-3" />
                <Label htmlFor="day-3" className="flex-1 cursor-pointer">৩ দিন আগে (ডিফল্ট)</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer">
                <RadioGroupItem value="7" id="day-7" />
                <Label htmlFor="day-7" className="flex-1 cursor-pointer">৭ দিন আগে</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSave} className="w-full">
              সংরক্ষণ করুন
            </Button>
            
            {'Notification' in window && Notification.permission !== 'granted' && (
              <Button 
                variant="outline" 
                onClick={requestNotificationPermission}
                className="w-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                নোটিফিকেশন চালু করুন
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 ভ্যাকসিন/ওষুধ দেওয়ার সময় হলে নোটিফিকেশন পাবেন
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
