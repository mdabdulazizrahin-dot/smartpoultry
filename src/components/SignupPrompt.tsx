import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cloud, Shield, Smartphone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SignupPromptProps {
  open: boolean;
  onClose: () => void;
}

export function SignupPrompt({ open, onClose }: SignupPromptProps) {
  const navigate = useNavigate();

  const handleSignup = () => {
    onClose();
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            ডেটা সুরক্ষিত রাখুন! 🔐
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            আপনার হিসাব সেভ হয়েছে, কিন্তু এটি শুধু এই ডিভাইসে আছে।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <Cloud className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">ক্লাউড ব্যাকআপ</p>
              <p className="text-xs text-muted-foreground">
                যেকোনো ডিভাইস থেকে আপনার ডেটা অ্যাক্সেস করুন
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">নিরাপদ সংরক্ষণ</p>
              <p className="text-xs text-muted-foreground">
                ফোন হারালে বা অ্যাপ ডিলিট হলেও ডেটা থাকবে
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
            <Smartphone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">মাল্টি-ডিভাইস সিঙ্ক</p>
              <p className="text-xs text-muted-foreground">
                ফোন ও কম্পিউটার দুটোতেই একই ডেটা
              </p>
            </div>
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
          <p className="text-sm text-destructive">
            ⚠️ সাইন আপ না করলে অ্যাপ ডিলিট বা ফোন পরিবর্তনে সব ডেটা হারাবেন!
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleSignup} className="w-full" size="lg">
            সাইন আপ করুন
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            পরে করব
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
