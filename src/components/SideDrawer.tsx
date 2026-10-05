import React from 'react';
import {
  X,
  User,
  Settings2,
  Sparkles,
  Cloud,
  Bot,
  Globe,
  Sun,
  Moon,
  LogOut,
  Tag,
  LayoutList,
  MessageSquareHeart,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { POULTRY_TYPES, PoultryTypeId } from '@/types/poultry';
import { PoultryBazarLogo } from './PoultryBazarHeader';

interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile: () => void;
  onOpenPoultrySettings: () => void;
  onOpenSetupWizard: () => void;
  onOpenDriveBackup: () => void;
  onOpenAiAssistant: () => void;
  onOpenPostAd?: () => void;
  onOpenMyAds?: () => void;
  onOpenFeedback?: () => void;
  enabledTypes: PoultryTypeId[];
  activeType: PoultryTypeId;
  onSelectType: (t: PoultryTypeId) => void;
  isLoggedIn?: boolean;
  onSignOut: () => void;
  userMobile?: string;
}

export function SideDrawer({
  open,
  onOpenChange,
  onOpenProfile,
  onOpenPoultrySettings,
  onOpenSetupWizard,
  onOpenDriveBackup,
  onOpenAiAssistant,
  onOpenPostAd,
  onOpenMyAds,
  onOpenFeedback,
  enabledTypes,
  activeType,
  onSelectType,
  isLoggedIn = true,
  onSignOut,
  userMobile,
}: SideDrawerProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const profileName = localStorage.getItem('user_profile_name') || 'Md Abdul Aziz';
  const profileMobile = localStorage.getItem('user_profile_mobile') || userMobile || '+8801951530277';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col bg-card">
        {/* Drawer Header with Poultry BAZAR branding */}
        <SheetHeader className="p-4 bg-[#EBF3EC] dark:bg-muted/40 border-b border-border/50 text-left">
          <div className="flex items-center gap-2.5">
            <PoultryBazarLogo className="w-9 h-9 shrink-0" />
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline tracking-tight font-black">
                <span className="text-[#009933] dark:text-emerald-400 text-lg font-black tracking-tight">
                  Poultry
                </span>
                <span className="text-[#EE0000] dark:text-red-500 text-lg font-black tracking-tight ml-1">
                  BAZAR
                </span>
              </div>
              <span className="text-[10px] text-[#009933] dark:text-emerald-400 font-bold mt-0.5">
                কিনুন, বেচুন, খুশি থাকুন
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* User Mini Profile Strip */}
        <div
          onClick={() => {
            onOpenChange(false);
            onOpenProfile();
          }}
          className="p-3.5 mx-3 mt-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-between gap-3 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#1E7E34] text-white flex items-center justify-center font-bold text-sm shrink-0">
              👤
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{profileName}</span>
              <span className="text-xs text-muted-foreground font-mono truncate">{profileMobile}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* 1. Poultry Types Switcher */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              আমার মুরগি (ধরন পরিবর্তন)
            </div>
            <div className="space-y-1">
              {POULTRY_TYPES.filter((t) => enabledTypes.includes(t.id)).map((item) => {
                const active = item.id === activeType;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectType(item.id);
                      onOpenChange(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{item.emoji}</span>
                      <span>{item.label}</span>
                    </div>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenPoultrySettings();
              }}
              className="w-full justify-start text-xs text-muted-foreground hover:text-foreground gap-2 h-8 rounded-lg mt-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>মুরগির ধরন যোগ বা বন্ধ করুন</span>
            </Button>
          </div>

          <div className="border-t border-border/50" />

          {/* 2. Core Actions */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              খামার ও বাজার সেবা
            </div>

            <button
              onClick={() => {
                onOpenChange(false);
                onOpenSetupWizard();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>খামার সেটআপ উইজার্ড</span>
            </button>

            {onOpenPostAd && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  onOpenPostAd();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>বিজ্ঞাপন দিন</span>
              </button>
            )}

            {onOpenMyAds && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  onOpenMyAds();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <LayoutList className="w-4 h-4 text-primary" />
                <span>আমার বিজ্ঞাপন</span>
              </button>
            )}

            {onOpenFeedback && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  onOpenFeedback();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <MessageSquareHeart className="w-4 h-4 text-rose-500" />
                <span>মতামত / ফিডব্যাক</span>
              </button>
            )}
          </div>

          <div className="border-t border-border/50" />

          {/* 3. Utilities */}
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              টুলস ও সেটিংস
            </div>

            <button
              onClick={() => {
                onOpenChange(false);
                onOpenDriveBackup();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-sky-500" />
              <span>Google Drive ব্যাকআপ</span>
            </button>

            <button
              onClick={() => {
                onOpenChange(false);
                onOpenAiAssistant();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4 text-emerald-500" />
              <span>স্মার্ট এআই সহকারী</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={() => {
                setLanguage(language === 'bn' ? 'en' : 'bn');
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>ভাষা (Language)</span>
              </div>
              <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-md">
                {language === 'bn' ? 'বাংলা' : 'English'}
              </span>
            </button>

            {/* Theme Switch */}
            <button
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-amber-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span>থিম (Theme)</span>
              </div>
              <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-md">
                {theme === 'dark' ? 'ডার্ক' : 'লাইট'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-border/60">
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              if (window.confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
                onSignOut();
              }
            }}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-500/10 gap-2.5 rounded-xl font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
