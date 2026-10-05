import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Menu,
  Pencil,
  CreditCard,
  Smartphone,
  Info,
  CheckCircle2,
  LayoutList,
  Tag,
  MessageSquareHeart,
  Lock,
  LogOut,
  ChevronRight,
  Star,
  Send,
  Plus,
  Trash2,
  Camera,
  X,
  Check,
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

interface AdItem {
  id: string;
  title: string;
  category: string;
  price: string;
  quantity: string;
  location: string;
  contact: string;
  status: 'সক্রিয়' | 'বন্ধ';
  date: string;
}

export function ProfileView({
  onBack,
  onOpenMenu,
  userMobile,
  isLoggedIn = true,
  onSignOut,
  onSignIn,
  avatarUrl,
  onUploadAvatar,
}: ProfileViewProps) {
  const { user } = useAuth();

  // Profile data state
  const [name, setName] = useState(() => {
    return localStorage.getItem('user_profile_name') || 'Md Abdul Aziz';
  });

  const [mobile, setMobile] = useState(() => {
    const raw = userMobile?.replace('@poultry.app', '') || user?.email?.replace('@poultry.app', '');
    return localStorage.getItem('user_profile_mobile') || raw || '+8801951530277';
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

  const [showMyAdsModal, setShowMyAdsModal] = useState(false);
  const [showPostAdModal, setShowPostAdModal] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Ads state
  const [ads, setAds] = useState<AdItem[]>(() => {
    try {
      const saved = localStorage.getItem('user_poultry_ads');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'ad-1',
        title: 'সুস্থ লেয়ার মুরগি ও টাটকা ডিম পাইকারি বিক্রয়',
        category: 'লেয়ার ও ডিম',
        price: '১০.৫০ ৳ প্রতি ডিম',
        quantity: '৫,০০০ টি',
        location: 'গাজীপুর',
        contact: mobile,
        status: 'সক্রিয়',
        date: 'আজ',
      },
    ];
  });

  // New Ad Form
  const [adTitle, setAdTitle] = useState('');
  const [adCategory, setAdCategory] = useState('ডিম');
  const [adPrice, setAdPrice] = useState('');
  const [adQuantity, setAdQuantity] = useState('');
  const [adLocation, setAdLocation] = useState('');
  const [adContact, setAdContact] = useState(mobile);

  // Sync profile from Supabase profiles table if available
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('farm_name, mobile_number')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.farm_name && !localStorage.getItem('user_profile_name')) {
              setName(data.farm_name);
            }
            if (data.mobile_number && !localStorage.getItem('user_profile_mobile')) {
              setMobile(data.mobile_number);
            }
          }
        });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('নাম লিখুন');
      return;
    }
    const cleanName = editName.trim();
    const cleanMobile = editMobile.trim() || mobile;

    setName(cleanName);
    setMobile(cleanMobile);
    localStorage.setItem('user_profile_name', cleanName);
    localStorage.setItem('user_profile_mobile', cleanMobile);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({
            farm_name: cleanName,
            mobile_number: cleanMobile,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } catch (e) {
        console.warn('Profile cloud update:', e);
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

      toast.success('আপনার মূল্যবান মতামতের জন্য ধন্যবাদ! 💌');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch {
      toast.error('ফিডব্যাক পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleCreateAd = () => {
    if (!adTitle.trim() || !adPrice.trim()) {
      toast.error('বিজ্ঞাপনের শিরোনাম ও মূল্য দিন');
      return;
    }

    const newAd: AdItem = {
      id: `ad-${Date.now()}`,
      title: adTitle.trim(),
      category: adCategory,
      price: adPrice.trim(),
      quantity: adQuantity.trim() || 'আলোচনা সাপেক্ষে',
      location: adLocation.trim() || 'বাংলাদেশ',
      contact: adContact.trim() || mobile,
      status: 'সক্রিয়',
      date: 'আজ',
    };

    const updated = [newAd, ...ads];
    setAds(updated);
    localStorage.setItem('user_poultry_ads', JSON.stringify(updated));

    setAdTitle('');
    setAdPrice('');
    setAdQuantity('');
    setAdLocation('');
    setShowPostAdModal(false);
    toast.success('আপনার বিজ্ঞাপনটি সফলভাবে প্রকাশিত হয়েছে! 🏷️');
  };

  const handleDeleteAd = (id: string) => {
    const updated = ads.filter((a) => a.id !== id);
    setAds(updated);
    localStorage.setItem('user_poultry_ads', JSON.stringify(updated));
    toast.info('বিজ্ঞাপন মুছে ফেলা হয়েছে');
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('নতুন পাসওয়ার্ড মিলছে না');
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

  return (
    <div className="min-h-screen bg-[#F6F8F6] dark:bg-background text-foreground flex flex-col">
      {/* Top App Bar */}
      <div className="bg-[#EBF3EC] dark:bg-card border-b border-border/50 px-3 py-3 flex items-center justify-between sticky top-0 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="w-10 h-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
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
        >
          <Menu className="w-5 h-5 text-foreground stroke-[2.2]" />
        </Button>
      </div>

      <div className="max-w-lg mx-auto w-full flex-1 pb-10">
        {/* User Card */}
        <div className="bg-[#EBF3EC] dark:bg-card px-5 py-4 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Green Circular Avatar */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#1E7E34] flex items-center justify-center text-white shadow-xs">
                  <span className="text-2xl select-none">👤</span>
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

          {/* Edit Profile Button (Pencil Icon) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditName(name);
              setEditMobile(mobile);
              setShowEditProfile(true);
            }}
            className="w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="প্রোফাইল সম্পাদনা"
          >
            <Pencil className="w-5 h-5 stroke-[2]" />
          </Button>
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
            <div className="shrink-0 flex items-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white dark:fill-emerald-500" />
            </div>
          </div>

          {/* Row 3: অ্যাকাউন্টের অবস্থা: সক্রিয় */}
          <div className="px-5 py-3.5 flex items-center gap-3.5">
            <div className="text-muted-foreground shrink-0">
              <Info className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">অ্যাকাউন্টের অবস্থা</span>
              <span className="text-sm font-semibold text-foreground">সক্রিয়</span>
            </div>
          </div>
        </div>

        {/* Navigation Actions Menu */}
        <div className="bg-card border-b border-border/60 divide-y divide-border/50 mt-4">
          {/* আমার বিজ্ঞাপন */}
          <button
            onClick={() => setShowMyAdsModal(true)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-foreground">
              <LayoutList className="w-5 h-5 text-muted-foreground stroke-[1.8]" />
              <span className="text-sm font-semibold">আমার বিজ্ঞাপন</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* বিজ্ঞাপন দিন */}
          <button
            onClick={() => setShowPostAdModal(true)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-foreground">
              <Tag className="w-5 h-5 text-muted-foreground stroke-[1.8]" />
              <span className="text-sm font-semibold">বিজ্ঞাপন দিন</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* মতামত / ফিডব্যাক (Highlight from Image 2) */}
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

          {/* পাসওয়ার্ড পরিবর্তন করুন */}
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

          {/* লগআউট */}
          <button
            onClick={() => {
              if (window.confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
                onSignOut();
              }
            }}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <LogOut className="w-5 h-5 stroke-[1.8]" />
              <span className="text-sm font-semibold">লগআউট</span>
            </div>
          </button>
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
              <Label className="text-xs">আপনার নাম</Label>
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

      {/* 2. মতামত / ফিডব্যাক (Feedback) Modal Dialog */}
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
                  আপনার মতামত অ্যাপটিকে আরও সুন্দর ও উপযোগী করতে সাহায্য করবে
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

      {/* 3. বিজ্ঞাপন দিন (Post Ad) Modal */}
      <Dialog open={showPostAdModal} onOpenChange={setShowPostAdModal}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">নতুন বিজ্ঞাপন দিন</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Poultry BAZAR-এ আপনার হাঁস-মুরগি, ডিম বা পণ্য বিক্রির বিজ্ঞাপন প্রকাশ করুন
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">পণ্যের ধরন</Label>
              <div className="flex flex-wrap gap-2">
                {['ডিম', 'লেয়ার মুরগি', 'সোনালি মুরগি', 'ব্রয়লার', 'কক', 'ফিড ও ওষুধ'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAdCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      adCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border border-border/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">বিজ্ঞাপনের শিরোনাম</Label>
              <Input
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="যেমন: ১০০০টি সুস্থ লেয়ার মুরগি বিক্রয়"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">মূল্য (৳)</Label>
                <Input
                  value={adPrice}
                  onChange={(e) => setAdPrice(e.target.value)}
                  placeholder="যেমন: ১০.৫০ ৳ বা আলোচনা"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">পরিমাণ</Label>
                <Input
                  value={adQuantity}
                  onChange={(e) => setAdQuantity(e.target.value)}
                  placeholder="যেমন: ৫০০ টি"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ঠিকানা / জেলা</Label>
                <Input
                  value={adLocation}
                  onChange={(e) => setAdLocation(e.target.value)}
                  placeholder="যেমন: ময়মনসিংহ"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">যোগাযোগের নম্বর</Label>
                <Input
                  value={adContact}
                  onChange={(e) => setAdContact(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPostAdModal(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                size="sm"
                onClick={handleCreateAd}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-1.5"
              >
                <Plus className="w-4 h-4" />
                বিজ্ঞাপন প্রকাশ করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. আমার বিজ্ঞাপন (My Ads) Modal */}
      <Dialog open={showMyAdsModal} onOpenChange={setShowMyAdsModal}>
        <DialogContent className="max-w-md rounded-2xl p-5 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-primary" />
                <DialogTitle className="text-base font-bold">আমার বিজ্ঞাপনসমূহ</DialogTitle>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setShowMyAdsModal(false);
                  setShowPostAdModal(true);
                }}
                className="h-7 text-xs rounded-full gap-1 bg-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন বিজ্ঞাপন
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 overflow-y-auto flex-1">
            {ads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                আপনার কোনো সক্রিয় বিজ্ঞাপন নেই।
              </div>
            ) : (
              ads.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-foreground leading-tight">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <div>ধরন: <span className="font-medium text-foreground">{item.category}</span></div>
                    <div>দাম: <span className="font-medium text-foreground">{item.price}</span></div>
                    <div>পরিমাণ: <span className="font-medium text-foreground">{item.quantity}</span></div>
                    <div>ঠিকানা: <span className="font-medium text-foreground">{item.location}</span></div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px]">📞 {item.contact}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAd(item.id)}
                      className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-500/10 text-xs gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      মুছুন
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Password Change Modal */}
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
    </div>
  );
}
