import { useState, useRef, useEffect } from 'react';
import { User, Settings, Globe, LogOut, LogIn, ChevronDown, Lock, Camera, Trash2, Sun, Moon, Monitor, Loader2, Cloud, CloudOff, Download, Check, Settings2, Upload, HardDrive, Bot, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/contexts/ThemeContext';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AIAssistantModal } from '@/components/AIAssistantModal';
import {
  isDriveConnected,
  getBackupInfo,
  downloadBackup,
  uploadBackup,
  clearDriveToken,
} from '@/lib/googleDriveBackup';

import { POULTRY_TYPES, PoultryTypeId } from '@/types/poultry';

interface PoultryProps {
  enabledTypes: PoultryTypeId[];
  activeType: PoultryTypeId;
  onSelectType: (t: PoultryTypeId) => void;
  onOpenPoultrySettings: () => void;
  onOpenSetupWizard?: () => void;
}

interface ProfileMenuProps {
  userMobile?: string;
  isLoggedIn?: boolean;
  onSignOut: () => void;
  onSignIn?: () => void;
  poultry?: PoultryProps;
}

export function ProfileMenu({ userMobile, isLoggedIn: propIsLoggedIn, onSignOut, onSignIn, poultry }: ProfileMenuProps) {
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDriveDialog, setShowDriveDialog] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Google Drive state
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveBackupTime, setDriveBackupTime] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);

  const { theme, setTheme } = useTheme();
  const { avatarUrl, isUploading, uploadAvatar, removeAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : !!user;

  // Extract display name from mobile (remove @poultry.app part if email format)
  const displayMobile = user?.email?.replace('@poultry.app', '') || (userMobile ? userMobile.replace('@poultry.app', '') : '');
  const avatarInitial = isLoggedIn && displayMobile ? displayMobile.slice(-2) : null;

  // Refresh drive status when dialog opens or connection changes
  useEffect(() => {
    const refreshDriveStatus = () => {
      const connected = isDriveConnected();
      setDriveConnected(connected);
      if (connected) {
        getBackupInfo()
          .then((info) =>
            setDriveBackupTime(info.exists ? info.modifiedTime ?? null : null),
          )
          .catch(() => setDriveBackupTime(null));
      } else {
        setDriveBackupTime(null);
      }
    };

    if (showDriveDialog) {
      refreshDriveStatus();
    }

    window.addEventListener('drive_connection_changed', refreshDriveStatus);
    window.addEventListener('storage', refreshDriveStatus);
    return () => {
      window.removeEventListener('drive_connection_changed', refreshDriveStatus);
      window.removeEventListener('storage', refreshDriveStatus);
    };
  }, [showDriveDialog]);

  const handleDownloadBackup = () => {
    try {
      const poultryFarmData = localStorage.getItem('poultryFarmData');
      const smartPoultrySystem = localStorage.getItem('smartPoultrySystem');
      const farmName = localStorage.getItem('smart_poultry_farm_name') || 'Smart Poultry';
      const reminderDays = localStorage.getItem('reminderDays');

      const backupObj = {
        version: 1,
        exportedAt: new Date().toISOString(),
        farmName,
        poultryFarmData: poultryFarmData ? JSON.parse(poultryFarmData) : null,
        smartPoultrySystem: smartPoultrySystem ? JSON.parse(smartPoultrySystem) : null,
        reminderDays: reminderDays ? Number(reminderDays) : 3,
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-poultry-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('সম্পূর্ণ ডেটা ব্যাকআপ ফাইল ডাউনলোড হয়েছে! 📥');
    } catch (err) {
      console.error('Backup download error:', err);
      toast.error('ব্যাকআপ ফাইল ডাউনলোড করতে সমস্যা হয়েছে');
    }
  };

  const handleRestoreFromFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);

        if (!parsed.poultryFarmData && !parsed.smartPoultrySystem) {
          toast.error('ফাইলটি সঠিক ব্যাকআপ ফাইল নয়');
          return;
        }

        if (parsed.poultryFarmData) {
          localStorage.setItem('poultryFarmData', JSON.stringify(parsed.poultryFarmData));
        }
        if (parsed.smartPoultrySystem) {
          localStorage.setItem('smartPoultrySystem', JSON.stringify(parsed.smartPoultrySystem));
        }
        if (parsed.farmName) {
          localStorage.setItem('smart_poultry_farm_name', parsed.farmName);
        }
        if (parsed.reminderDays) {
          localStorage.setItem('reminderDays', String(parsed.reminderDays));
        }

        toast.success('ব্যাকআপ থেকে সফলভাবে ডেটা রিস্টোর হয়েছে! রিলোড হচ্ছে... 🔄');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        console.error('Restore error:', err);
        toast.error('ব্যাকআপ ফাইল পড়তে সমস্যা হয়েছে। সঠিক JSON ফাইল দিন।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReconnectDrive = async () => {
    if (!isLoggedIn) {
      toast.error('Google Drive কানেক্ট করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন');
      setShowDriveDialog(false);
      if (onSignIn) {
        onSignIn();
      } else {
        navigate('/auth');
      }
      return;
    }
    try {
      localStorage.setItem('auth_redirect_purpose', 'connect_drive');
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        localStorage.setItem(
          'pre_drive_connect_session',
          JSON.stringify({
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
          })
        );
      } else {
        localStorage.removeItem('pre_drive_connect_session');
      }

      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative
        ? 'com.smartpoultry.app://auth/callback'
        : `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative,
          scopes: 'https://www.googleapis.com/auth/drive.appdata',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (isNative) {
          await Browser.open({ url: data.url, windowName: '_self' });
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      console.error('Google Drive error:', error);
      localStorage.removeItem('auth_redirect_purpose');
      localStorage.removeItem('pre_drive_connect_session');
      toast.error('Google Drive কানেক্ট করা সম্ভব হয়নি: ' + (error?.message || ''));
    }
  };

  const handleUploadToDrive = async () => {
    setDriveBusy(true);
    try {
      const current = localStorage.getItem('poultryFarmData');
      const farmData = current ? JSON.parse(current) : null;
      if (!farmData) {
        toast.error('ব্যাকআপ করার মতো কোনো তথ্য পাওয়া যায়নি');
        return;
      }
      await uploadBackup(farmData);
      const info = await getBackupInfo();
      setDriveBackupTime(info.exists ? info.modifiedTime ?? new Date().toISOString() : new Date().toISOString());
      toast.success('Google Drive-এ সফলভাবে ব্যাকআপ সংরক্ষিত হয়েছে! ☁️');
    } catch (err: any) {
      console.error('Drive upload error:', err);
      if (err?.message === 'drive_token_expired' || err?.message === 'drive_not_connected') {
        toast.error('Drive সেশন শেষ হয়ে গেছে — আবার কানেক্ট করুন');
        setDriveConnected(false);
      } else {
        toast.error('Google Drive-এ ব্যাকআপ করতে সমস্যা হয়েছে');
      }
    } finally {
      setDriveBusy(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    setDriveBusy(true);
    try {
      const payload = await downloadBackup();
      if (!payload) {
        toast.error('Drive-এ কোনো backup পাওয়া যায়নি');
        return;
      }
      if (payload.data) {
        localStorage.setItem('poultryFarmData', JSON.stringify(payload.data));
      }
      if (payload.poultrySystem) {
        localStorage.setItem('smartPoultrySystem', JSON.stringify(payload.poultrySystem));
      }
      if (payload.farmName) {
        localStorage.setItem('smart_poultry_farm_name', payload.farmName);
      }
      toast.success('Drive থেকে সম্পূর্ণ ডেটা রিস্টোর হয়েছে! রিলোড হচ্ছে...');
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      if (err?.message === 'drive_token_expired' || err?.message === 'drive_not_connected') {
        toast.error('Drive টোকেন এক্সপায়ার্ড — আবার কানেক্ট করুন');
        setDriveConnected(false);
      } else {
        toast.error('Drive থেকে রিস্টোর ব্যর্থ হয়েছে');
      }
    } finally {
      setDriveBusy(false);
    }
  };

  const handleDisconnectDrive = () => {
    clearDriveToken();
    setDriveConnected(false);
    setDriveBackupTime(null);
    toast.info('Google Drive সংযোগ বিচ্ছিন্ন করা হয়েছে');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('সব ফিল্ড পূরণ করুন');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড মিলছে না');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error('পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে');
        return;
      }

      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('কিছু ভুল হয়েছে');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: t('light'), icon: Sun },
    { value: 'dark', label: t('dark'), icon: Moon },
    { value: 'system', label: t('systemTheme'), icon: Monitor },
  ];

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {!isLoggedIn ? (
            (localStorage.getItem('header_button_variant') || '2') === '1' ? (
              /* Variant 1: Solid Emerald Login */
              <Button 
                variant="default" 
                size="sm" 
                className="h-8 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all gap-1.5 border border-emerald-500/40 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('loginNow')}</span>
                <ChevronDown className="w-3 h-3 text-emerald-100 ml-0.5" />
              </Button>
            ) : (localStorage.getItem('header_button_variant') || '2') === '3' ? (
              /* Variant 3: Minimal Profile Avatar with amber dot */
              <Button variant="ghost" size="sm" className="relative p-1 h-8 w-8 rounded-full hover:bg-muted/80 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-background animate-pulse" />
              </Button>
            ) : (localStorage.getItem('header_button_variant') || '2') === '4' ? (
              /* Variant 4: Account Pill */
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 rounded-full border-border/80 hover:border-primary/40 bg-card hover:bg-primary/5 text-foreground font-semibold text-xs shadow-2xs gap-1.5 transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span>{t('account')}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            ) : (
              /* Variant 2 (Default): Two-Tone Smart Capsule */
              <div className="inline-flex items-center h-8 rounded-full border border-emerald-500/30 bg-card p-0.5 shadow-2xs hover:border-emerald-500/60 transition-all cursor-pointer select-none">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{t('guest')}</span>
                </div>
                <div className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors">
                  <span>{t('login')}</span>
                  <ChevronDown className="w-3 h-3 text-emerald-100" />
                </div>
              </div>
            )
          ) : (
            <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Profile" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {avatarInitial ? (
                      avatarInitial
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-popover border border-border shadow-xl z-50 p-1.5 rounded-xl"
        >
          {/* Top Banner: Guest Card vs Logged In Profile */}
          {!isLoggedIn ? (
            <div className="p-3 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent rounded-xl border border-primary/20 space-y-2 mb-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-xs font-bold text-foreground">{t('guestMode')}</p>
                </div>
                <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium px-1.5 py-0.5 rounded-full border border-amber-500/20">
                  {t('unsecured')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {t('guestDesc')}
              </p>
              <Button
                size="sm"
                className="w-full h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                onClick={onSignIn || (() => navigate('/auth'))}
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('loginOrSignUp')}
              </Button>
            </div>
          ) : (
            <>
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{t('profile')}</p>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium px-1.5 py-0.5 rounded-full">
                      ✓ {t('active')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-number">
                    {displayMobile || t('user')}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {/* AI Assistant Help & Support Menu Item */}
          <div className="p-0.5">
            <DropdownMenuItem 
              onClick={() => setShowAiAssistant(true)}
              className="cursor-pointer gap-2.5 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 focus:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 rounded-lg border border-emerald-500/20 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold flex items-center gap-1">
                  {t('smartAiAssistant')}
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight truncate">
                  {t('aiGuideSubtitle')}
                </span>
              </div>
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator />

          {/* Poultry Types */}
          {poultry && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                {t('myPoultry')}
              </DropdownMenuLabel>
              {POULTRY_TYPES.filter((t) => poultry.enabledTypes.includes(t.id)).map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => poultry.onSelectType(t.id)}
                  className="cursor-pointer gap-2"
                >
                  <span>{t.emoji}</span>
                  <span className="flex-1">{t.label}</span>
                  {t.id === poultry.activeType && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={poultry.onOpenPoultrySettings}
                className="cursor-pointer gap-2"
              >
                <Settings2 className="w-4 h-4" />
                <span>{t('poultrySettings')}</span>
              </DropdownMenuItem>
              {poultry.onOpenSetupWizard && (
                <DropdownMenuItem
                  onClick={poultry.onOpenSetupWizard}
                  className="cursor-pointer gap-2 text-primary font-medium"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>খামার সেটআপ উইজার্ড</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Settings & Info */}
          {isLoggedIn && (
            <DropdownMenuItem 
              onClick={() => setShowAccountDialog(true)}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>{t('accountInfo')}</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowSettingsDialog(true)}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('settings')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowLanguageDialog(true)}
            className="cursor-pointer"
          >
            <Globe className="mr-2 h-4 w-4" />
            <span>{t('language')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDriveDialog(true)}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center">
              <Cloud className={`mr-2 h-4 w-4 ${isDriveConnected() && isLoggedIn ? 'text-success' : 'text-primary'}`} />
              <span>{t('driveBackup')}</span>
            </div>
            {!isLoggedIn && (
              <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium px-1.5 py-0.5 rounded">
                {t('loginRequired')}
              </span>
            )}
          </DropdownMenuItem>
          
          {isLoggedIn && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onSignOut}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Account Info Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('accountInfo')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isLoggedIn ? (
              <div className="space-y-4 py-2 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-base">{t('guestMode')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('guestAccountNotice')}
                  </p>
                </div>
                <Button
                  className="w-full gap-2 font-semibold"
                  onClick={() => {
                    setShowAccountDialog(false);
                    if (onSignIn) {
                      onSignIn();
                    } else {
                      navigate('/auth');
                    }
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  {t('loginNow')}
                </Button>
              </div>
            ) : (
              <>
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="Profile" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-3xl font-medium">
                        {avatarInitial}
                      </AvatarFallback>
                    </Avatar>
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      {t('uploadPhoto')}
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{t('mobileNumber')}</p>
                    <p className="font-medium">{displayMobile || t('user')}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{t('accountStatus')}</p>
                    <p className="font-medium text-success">✓ {t('active')}</p>
                  </div>
                </div>

                {/* Password Change Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowAccountDialog(false);
                    setShowPasswordDialog(true);
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {t('changePasswordBtn')}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('changePassword')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                placeholder={t('enterNewPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={t('reEnterPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('changingPassword')}
                </>
              ) : (
                t('changePasswordBtn')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('settings')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('theme')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "default" : "outline"}
                      className="flex flex-col gap-1 h-auto py-3"
                      onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t('selectLanguage')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <RadioGroup 
              value={language} 
              onValueChange={(val) => {
                const newLang = val as 'bn' | 'en';
                setLanguage(newLang);
                toast.success(newLang === 'en' ? t('languageSwitchedEn') : t('languageSwitchedBn'));
                setShowLanguageDialog(false);
              }}
            >
              <div 
                onClick={() => {
                  setLanguage('bn');
                  toast.success(t('languageSwitchedBn'));
                  setShowLanguageDialog(false);
                }}
                className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer mb-2.5 ${
                  language === 'bn' 
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20' 
                    : 'border-border bg-muted/40 hover:bg-muted/70'
                }`}
              >
                <RadioGroupItem value="bn" id="bn" />
                <Label htmlFor="bn" className="flex-1 cursor-pointer flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{t('bengaliName')}</span>
                    <span className="text-[11px] text-muted-foreground">{t('bengaliDesc')}</span>
                  </div>
                  {language === 'bn' && <Check className="w-4 h-4 text-primary font-bold" />}
                </Label>
              </div>

              <div 
                onClick={() => {
                  setLanguage('en');
                  toast.success(t('languageSwitchedEn'));
                  setShowLanguageDialog(false);
                }}
                className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20' 
                    : 'border-border bg-muted/40 hover:bg-muted/70'
                }`}
              >
                <RadioGroupItem value="en" id="en" />
                <Label htmlFor="en" className="flex-1 cursor-pointer flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{t('englishName')}</span>
                    <span className="text-[11px] text-muted-foreground">{t('englishDesc')}</span>
                  </div>
                  {language === 'en' && <Check className="w-4 h-4 text-primary font-bold" />}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </DialogContent>
      </Dialog>

      <input
        type="file"
        ref={restoreFileInputRef}
        onChange={handleRestoreFromFileInput}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Google Drive Backup & Restore Dialog */}
      <Dialog open={showDriveDialog} onOpenChange={setShowDriveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" />
              {t('driveBackup')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!isLoggedIn ? (
              <div className="border border-border/80 rounded-xl p-4 bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-primary" />
                    {t('driveStatus')}
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                    {t('loginRequired')}
                  </span>
                </div>

                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-foreground space-y-1.5">
                  <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-sm">
                    <Lock className="w-4 h-4" />
                    {t('driveLoginNoticeTitle')}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    {t('driveLoginNoticeDesc')}
                  </p>
                </div>

                <Button 
                  type="button" 
                  variant="default" 
                  size="default" 
                  className="w-full text-sm gap-2 h-11 shadow-sm font-semibold"
                  onClick={() => {
                    setShowDriveDialog(false);
                    if (onSignIn) {
                      onSignIn();
                    } else {
                      navigate('/auth');
                    }
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  {t('loginNow')}
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-primary" />
                    {t('driveStatus')}
                  </span>
                  {driveConnected ? (
                    <span className="text-xs bg-success/15 text-success px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      {t('driveConnectedLive')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t('driveNotConnected')}</span>
                  )}
                </div>

                {driveConnected ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t('driveAutoSyncTip')}
                    </p>
                    {driveBackupTime && (
                      <p className="text-[11px] text-muted-foreground">
                        {t('lastSync')}: {new Date(driveBackupTime).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </p>
                    )}
                  </div>
                ) : null}

                {driveConnected ? (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5 h-10"
                        onClick={handleUploadToDrive}
                        disabled={driveBusy}
                      >
                        {driveBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-primary" />
                        )}
                        {t('backupNow')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5 h-10"
                        onClick={handleRestoreFromDrive}
                        disabled={driveBusy}
                      >
                        {driveBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 text-success" />
                        )}
                        {t('restoreDrive')}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-destructive h-8 mt-1"
                      onClick={handleDisconnectDrive}
                    >
                      {t('disconnectDrive')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('drivePromoDesc')}
                    </p>
                    <Button 
                      type="button" 
                      variant="default" 
                      size="default" 
                      className="w-full text-sm gap-2 h-11 shadow-sm font-semibold"
                      onClick={handleReconnectDrive}
                    >
                      <Cloud className="w-4 h-4" />
                      {t('connectDrive')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Modal for Farm Calculations & Account Help */}
      <AIAssistantModal
        open={showAiAssistant}
        onOpenChange={setShowAiAssistant}
        initialMode="general"
      />
    </>
  );
}
