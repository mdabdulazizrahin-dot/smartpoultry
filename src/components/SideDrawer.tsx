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
  LogIn,
  ChevronRight,
  Check,
  ShieldCheck,
  Smartphone,
  Download,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { POULTRY_TYPES, PoultryTypeId } from '@/types/poultry';
import { SmartPoultryLogo } from './PoultryBazarHeader';
import { useAuth } from '@/contexts/AuthContext';

interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile: () => void;
  onOpenPoultrySettings: () => void;
  onOpenSetupWizard: () => void;
  onOpenDriveBackup: () => void;
  onOpenAiAssistant: () => void;
  enabledTypes: PoultryTypeId[];
  activeType: PoultryTypeId;
  onSelectType: (t: PoultryTypeId) => void;
  isLoggedIn?: boolean;
  onSignOut: () => void;
  onSignIn?: () => void;
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
  enabledTypes,
  activeType,
  onSelectType,
  isLoggedIn = false,
  onSignOut,
  onSignIn,
  userMobile,
}: SideDrawerProps) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Determine real user display values
  const storedName = localStorage.getItem('user_profile_name');
  const realName = storedName || user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : '');
  const realMobile = localStorage.getItem('user_profile_mobile') || userMobile || user?.phone || (user?.email?.includes('@poultry.app') ? user.email.replace('@poultry.app', '') : user?.email) || '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col bg-card">
        {/* Drawer Header with Smart Poultry branding */}
        <SheetHeader className="p-4 bg-[#EBF3EC] dark:bg-muted/40 border-b border-border/50 text-left">
          <div className="flex items-center gap-2.5">
            <SmartPoultryLogo className="w-9 h-9 shrink-0" />
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline tracking-tight font-black">
                <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black tracking-tight">
                  Smart
                </span>
                <span className="text-foreground text-lg font-black tracking-tight ml-1">
                  Poultry
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                স্মার্ট খামার ব্যবস্থাপনা
              </span>
            </div>
          </div>
          <SheetTitle className="sr-only">স্মার্ট পোল্ট্রি প্রধান মেনু</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* User Profile / Login Card */}
          {isLoggedIn ? (
            <div
              onClick={() => {
                onOpenChange(false);
                onOpenProfile();
              }}
              className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/25 flex items-center justify-between gap-3 cursor-pointer hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-foreground truncate">
                    {realName || 'খামারী প্রোফাইল'}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {realMobile || 'প্রোফাইল তথ্য দেখুন'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-muted/50 border border-border flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">অতিথি খামারী</span>
                  <span className="text-[11px] text-muted-foreground">ক্লাউড ব্যাকআপের জন্য লগইন করুন</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  if (onSignIn) onSignIn();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs gap-1.5 h-8.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                লগইন / সাইনআপ করুন
              </Button>
            </div>
          )}

          {/* Active Poultry Type Switcher - Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                খামারের ধরন নির্বাচন
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenPoultrySettings();
                }}
                className="h-6 px-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <Settings2 className="w-3 h-3 mr-1" />
                কাস্টমাইজ
              </Button>
            </div>

            <Select
              value={activeType}
              onValueChange={(val) => {
                onSelectType(val as PoultryTypeId);
                onOpenChange(false);
              }}
            >
              <SelectTrigger className="w-full h-12 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/70 px-3 flex items-center justify-between text-left cursor-pointer transition-colors shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0 select-none">
                    {POULTRY_TYPES.find(t => t.id === activeType)?.emoji || '🐔'}
                  </span>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-[10px] text-muted-foreground font-semibold leading-tight">
                      বর্তমান সক্রিয় খামার
                    </span>
                    <span className="text-sm font-bold text-foreground truncate leading-tight">
                      {POULTRY_TYPES.find(t => t.id === activeType)?.label || 'লেয়ার'}
                    </span>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-xl rounded-xl z-50 p-1">
                {POULTRY_TYPES.filter(t => t.id !== 'other').map((item) => (
                  <SelectItem 
                    key={item.id} 
                    value={item.id} 
                    className="cursor-pointer py-2.5 rounded-lg flex items-center gap-2.5 my-0.5 font-semibold text-sm"
                  >
                    <span className="text-xl shrink-0 mr-1.5">{item.emoji}</span>
                    <span>{item.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Farm Setup & Tools */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block px-1 pb-1">
              খামার ও সেবা
            </span>

            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                onOpenSetupWizard();
              }}
              className="w-full justify-start gap-3 h-11 rounded-xl text-foreground hover:bg-muted"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">খামার সেটআপ উইজার্ড</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                onOpenDriveBackup();
              }}
              className="w-full justify-start gap-3 h-11 rounded-xl text-foreground hover:bg-muted"
            >
              <Cloud className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-medium">Google Drive ব্যাকআপ</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                onOpenAiAssistant();
              }}
              className="w-full justify-start gap-3 h-11 rounded-xl text-foreground hover:bg-muted"
            >
              <Bot className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">স্মার্ট এআই সহকারী</span>
            </Button>

            <a
              href="/SmartPoultry.apk"
              download="SmartPoultry.apk"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 transition-colors cursor-pointer mt-1"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-bold text-foreground">অ্যাপ ডাউনলোড (APK)</span>
                  <span className="text-[10px] text-muted-foreground">৮.৪২ MB • সরাসরি ইনস্টল করুন</span>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </a>
          </div>

          {/* App Preferences */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block px-1 pb-1">
              সেটিংস
            </span>

            {/* Language Switch */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2.5 text-sm text-foreground">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>ভাষা (Language)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="h-7 px-2.5 text-xs rounded-lg font-semibold"
              >
                {language === 'bn' ? 'বাংলা' : 'English'}
              </Button>
            </div>

            {/* Theme Switch */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2.5 text-sm text-foreground">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-purple-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span>থিম (Theme)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-7 px-2.5 text-xs rounded-lg font-semibold"
              >
                {theme === 'dark' ? 'ডার্ক' : 'লাইট'}
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-border/60 bg-muted/10">
          {isLoggedIn ? (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onSignOut();
              }}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-500/20 rounded-xl justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false);
                if (onSignIn) onSignIn();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl justify-center gap-2 font-semibold shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>লগইন করুন</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
