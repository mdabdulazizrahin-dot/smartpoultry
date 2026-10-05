import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export function ApkDownloadBanner() {
  const [dismissed, setDismissed] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // If already running inside native Android/iOS app, do not show download prompt
  if (isNative) {
    return null;
  }

  const handleDownload = () => {
    toast.success('স্মার্ট পোল্ট্রি অ্যান্ড্রয়েড অ্যাপ ডাউনলোড শুরু হয়েছে! 📲', {
      description: 'ডাউনলোড শেষে ফাইলে ট্যাপ করে সরাসরি ইনস্টল করুন।',
      duration: 6000,
    });
  };

  if (dismissed) {
    return (
      <div className="flex justify-end">
        <a
          href="/SmartPoultry.apk"
          download="SmartPoultry.apk"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all shadow-2xs"
          title="অ্যান্ড্রয়েড APK ডাউনলোড করুন"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>📱 অ্যাপ ডাউনলোড (৮.৪ MB)</span>
          <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/15 via-emerald-500/10 to-teal-500/15 border-2 border-emerald-500/30 p-3.5 sm:p-4 shadow-sm transition-all">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Smartphone className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                স্মার্ট পোল্ট্রি মোবাইল অ্যাপ
              </h4>
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                অফিসিয়াল APK
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              মোবাইলে আরও দ্রুত ও সহজে ব্যবহার করতে সরাসরি APK ফাইলটি ডাউনলোড করে ইনস্টল করুন।
            </p>
          </div>
        </div>

        {/* Close / Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
          aria-label="বিজ্ঞপ্তি বন্ধ করুন"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Row */}
      <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>সাইজ মাত্র ৮.৪২ MB • সব অ্যান্ড্রয়েড ফোনে চলবে</span>
        </div>

        <a
          href="/SmartPoultry.apk"
          download="SmartPoultry.apk"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>সরাসরি APK ডাউনলোড করুন</span>
        </a>
      </div>
    </div>
  );
}
