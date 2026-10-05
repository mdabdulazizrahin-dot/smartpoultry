import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Menu,
  Pencil,
  CreditCard,
  Smartphone,
  Info,
  CheckCircle2,
  MessageSquareHeart,
  Lock,
  LogOut,
  LogIn,
  ChevronRight,
  Star,
  Send,
  User,
  Check,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileViewProps {
  onBack: () => void;
  onOpenMenu: () => void;
  userMobile?: string;
  isLoggedIn?: boolean;
  onSignOut: () => void;
  onSignIn?: () => void;
  avatarUrl?: string | null;
  onUploadAvatar?: (file: File) => Promise<string | null>;
}

export function ProfileView({
  onBack,
  onOpenMenu,
  userMobile,
  isLoggedIn = false,
  onSignOut,
  onSignIn,
  avatarUrl,
  onUploadAvatar,
}: ProfileViewProps) {
  const { user } = useAuth();

  // Profile data state - initialized from real user data, NOT hardcoded dummy names
  const [name, setName] = useState<string>(() => {
    return (
      localStorage.getItem('user_profile_name') ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      (user?.email ? user.email.split('@')[0] : '') ||
      (isLoggedIn ? 'খামারী' : 'অতিথি খামারী')
    );
  });

  const [mobile, setMobile] = useState<string>(() => {
    const raw = userMobile?.replace('@poultry.app', '') || user?.email?.replace('@poultry.app', '');
    return (
      localStorage.getItem('user_profile_mobile') ||
      raw ||
      user?.phone ||
      (isLoggedIn ? 'নম্বর যুক্ত নেই' : 'লগইন করা নেই')
    );
  });

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editMobile, setEditMobile] = useState(mobile);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState('পরামর্শ');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync profile from Supabase profiles table for the authenticated user
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('farm_name, mobile_number')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.farm_name) {
              setName(data.farm_name);
              localStorage.setItem('user_profile_name', data.farm_name);
            }
            if (data.mobile_number && data.mobile_number !== 'unknown') {
              setMobile(data.mobile_number);
              localStorage.setItem('user_profile_mobile', data.mobile_number);
            }
          }
        });
    } else {
      // If logged out, reset to guest state
      setName('অতিথি খামারী');
      setMobile('লগইন করা নেই');
    }
  }, [user, isLoggedIn]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('নাম লিখুন');
      return;
    }
    const cleanName = editName.trim();
    const cleanMobile = editMobile.trim();

    setName(cleanName);
    setMobile(cleanMobile);
    localStorage.setItem('user_profile_name', cleanName);
    if (cleanMobile) {
      localStorage.setItem('user_profile_mobile', cleanMobile);
    }

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({
            farm_name: cleanName,
            ...(cleanMobile ? { mobile_number: cleanMobile } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } catch (e) {
        console.warn('Profile cloud update error:', e);
      }
    }

    setShowEditProfile(false);
    toast.success('প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে! ✅');
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('অনুগ্রহ করে আপনার মতামত বা ফিডব্যাক লিখুন');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const newFeedback = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        rating: feedbackRating,
        type: feedbackType,
        text: feedbackText.trim(),
        user_name: name,
        user_mobile: mobile,
        created_at: new Date().toISOString(),
      };

      const existingFeedbacks = JSON.parse(localStorage.getItem('user_feedbacks') || '[]');
      existingFeedbacks.unshift(newFeedback);
      localStorage.setItem('user_feedbacks', JSON.stringify(existingFeedbacks));

      toast.success('আপনার মূল্যবান মতামতের জন্য অনেক ধন্যবাদ! 💌');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch {
      toast.error('ফিডব্যাক পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড নিশ্চিতকরণের সাথে মিলছে না');
      return;
    }

    setIsChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! 🔐');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e?.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('user_profile_name');
    localStorage.removeItem('user_profile_mobile');
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] dark:bg-background text-foreground flex flex-col">
      {/* Top App Bar */}
      <div className="bg-[#EBF3EC] dark:bg-card border-b border-border/50 px-3 py-3 flex items-center justify-between sticky top-0 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="w-10 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          aria-label="ফিরে যান"
        >
          <ArrowLeft className="w-5 h-5 text-foreground stroke-[2.2]" />
        </Button>

        <h1 className="text-lg font-bold text-foreground tracking-tight select-none">
          প্রোফাইল
        </h1>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          aria-label="মেনু"
        >
          <Menu className="w-5 h-5 text-foreground stroke-[2.2]" />
        </Button>
      </div>

      <div className="max-w-lg mx-auto w-full flex-1 pb-10">
        {/* User Card */}
        <div className="bg-[#EBF3EC] dark:bg-card px-5 py-4 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circular Avatar */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                />
              ) : isLoggedIn ? (
                <div className="w-14 h-14 rounded-full bg-[#1E7E34] flex items-center justify-center text-white shadow-xs">
                  <User className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground shadow-xs">
                  <User className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h2 className="text-xl font-bold text-foreground tracking-tight truncate leading-tight">
                {name}
              </h2>
              <p className="text-sm text-muted-foreground font-mono truncate mt-0.5">
                {mobile}
              </p>
            </div>
          </div>

          {/* Edit Profile Button (Pencil Icon) - only when logged in */}
          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditName(name);
                setEditMobile(mobile === 'নম্বর যুক্ত নেই' ? '' : mobile);
                setShowEditProfile(true);
              }}
              className="w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              aria-label="প্রোফাইল সম্পাদনা"
            >
              <Pencil className="w-5 h-5 stroke-[2]" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onSignIn}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1 font-semibold"
            >
              <LogIn className="w-3.5 h-3.5" />
              লগইন
            </Button>
          )}
        </div>

        {/* Section Heading: প্রোফাইল তথ্য */}
        <div className="px-5 pt-4 pb-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            প্রোফাইল তথ্য
          </h3>
        </div>

        {/* Info Rows Card */}
        <div className="bg-card border-y border-border/60 divide-y divide-border/50">
          {/* Row 1: নাম */}
          <div className="px-5 py-3.5 flex items-center gap-3.5">
            <div className="text-muted-foreground shrink-0">
              <CreditCard className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">নাম</span>
              <span className="text-sm font-semibold text-foreground truncate">{name}</span>
            </div>
          </div>

          {/* Row 2: মোবাইল নম্বর + Verified Badge */}
          <div className="px-5 py-3.5 flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="text-muted-foreground shrink-0">
                <Smartphone className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground font-medium">মোবাইল নম্বর</span>
                <span className="text-sm font-semibold text-foreground font-mono truncate">{mobile}</span>
              </div>
            </div>
            {isLoggedIn && mobile !== 'নম্বর যুক্ত নেই' && (
              <div className="shrink-0 flex items-center text-emerald-600 dark:text-emerald-400" title="যাচাইকৃত">
                <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white dark:fill-emerald-500" />
              </div>
            )}
          </div>

          {/* Row 3: অ্যাকাউন্টের অবস্থা */}
          <div className="px-5 py-3.5 flex items-center gap-3.5">
            <div className="text-muted-foreground shrink-0">
              <Info className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">অ্যাকাউন্টের অবস্থা</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isLoggedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isLoggedIn ? 'সক্রিয়' : 'লগইন প্রয়োজন'}
                </span>
                {isLoggedIn ? (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/25">
                    ক্লাউড সিঙ্ক চালু
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/25">
                    অফলাইন মোড
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Actions Menu */}
        <div className="bg-card border-b border-border/60 divide-y divide-border/50 mt-4">
          {/* মতামত / ফিডব্যাক (Highlight feature requested by user) */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-foreground">
              <MessageSquareHeart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[1.8]" />
              <span className="text-sm font-semibold text-foreground">মতামত / ফিডব্যাক</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/25">
                নতুন
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </button>

          {/* অ্যান্ড্রয়েড অ্যাপ ডাউনলোড */}
          <a
            href="/SmartPoultry.apk"
            download="SmartPoultry.apk"
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-foreground">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[1.8]" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">অ্যান্ড্রয়েড অ্যাপ ডাউনলোড (APK)</span>
                <span className="text-xs text-muted-foreground font-mono">৮.৪২ MB • সরাসরি ইনস্টল করুন</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
          </a>

          {/* পাসওয়ার্ড পরিবর্তন করুন (if logged in) */}
          {isLoggedIn && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 text-foreground">
                <Lock className="w-5 h-5 text-muted-foreground stroke-[1.8]" />
                <span className="text-sm font-semibold">পাসওয়ার্ড পরিবর্তন করুন</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* লগইন / সাইনআপ (if NOT logged in) */}
          {!isLoggedIn && (
            <button
              onClick={onSignIn}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <LogIn className="w-5 h-5 stroke-[1.8]" />
                <span className="text-sm font-semibold">লগইন / সাইনআপ করুন</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          {/* লগআউট (if logged in) */}
          {isLoggedIn && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <LogOut className="w-5 h-5 stroke-[1.8]" />
                <span className="text-sm font-semibold">লগআউট</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 1. Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">প্রোফাইল তথ্য পরিবর্তন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">আপনার নাম / খামারের নাম</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="পূর্ণ নাম লিখুন"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">মোবাইল নম্বর</Label>
              <Input
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="rounded-xl font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditProfile(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                size="sm"
                onClick={handleSaveProfile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1"
              >
                <Check className="w-4 h-4" />
                সংরক্ষণ করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. মতামত / ফিডব্যাক Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  মতামত / ফিডব্যাক
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Smart Poultry অ্যাপটিকে আপনার জন্য আরও ভালো করতে মতামত দিন
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Rating Stars */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                অ্যাপটি কেমন লেগেছে? (রেটিং দিন)
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= feedbackRating
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-transparent text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-600 ml-1">
                  {feedbackRating === 5 ? 'চমৎকার! ⭐' : `${feedbackRating} স্টার`}
                </span>
              </div>
            </div>

            {/* Feedback Category Pills */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                মতামতের ধরন
              </Label>
              <div className="flex flex-wrap gap-2">
                {['পরামর্শ', 'নতুন ফিচার দাবি', 'সমস্যা / বাগ', 'প্রশংসা', 'অন্যান্য'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFeedbackType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      feedbackType === type
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-muted hover:bg-muted/80 text-foreground border border-border/60'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Details */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                আপনার মতামত বিস্তারিত লিখুন
              </Label>
              <Textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="যেমন: খামারের হিসাব আরও সহজে দেখতে চাই, বা কোনো সমস্যা হচ্ছে..."
                className="rounded-xl resize-none text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedbackModal(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                মতামত পাঠান
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">পাসওয়ার্ড পরিবর্তন করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">নতুন পাসওয়ার্ড</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">নতুন পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় লিখুন"
                className="rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                size="sm"
                onClick={handlePasswordChange}
                disabled={isChangingPass}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                পরিবর্তন করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  লগআউট নিশ্চিতকরণ
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  আপনি কি আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutConfirm(false)}
              className="rounded-xl"
            >
              না, থাকুন
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              হ্যাঁ, লগআউট
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
