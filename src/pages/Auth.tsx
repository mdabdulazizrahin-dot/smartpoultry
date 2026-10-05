import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, Loader2, Key, ShieldCheck, Bot, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIAssistantModal } from '@/components/AIAssistantModal';

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const normalizeMobile = (m: string) => {
  return m
    .replace(/[০-৯]/g, (d) => '0123456789'['০১২৩৪৫৬৭৮৯'.indexOf(d)])
    .replace(/[^0-9]/g, '')
    .trim();
};

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 4-digit PIN Reset Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotPin, setForgotPin] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // AI Assistant Modal State
  const [showAiModal, setShowAiModal] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      localStorage.removeItem('auth_redirect_purpose');
      localStorage.removeItem('pre_drive_connect_session');

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
      console.error('Google OAuth error:', error);
      toast.error(error?.message || 'Google দিয়ে লগইন/সাইন আপ ব্যর্থ হয়েছে');
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async () => {
    const cleanMobile = normalizeMobile(mobile);
    if (!cleanMobile) {
      toast.error('মোবাইল নম্বর দিন');
      return;
    }
    if (cleanMobile.length < 11 || !cleanMobile.startsWith('01')) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    if (!password) {
      toast.error('পাসওয়ার্ড দিন');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(cleanMobile, password);
      if (error) throw error;
      toast.success('সফলভাবে লগইন হয়েছে!');
      navigate('/');
    } catch (error) {
      toast.error('লগইন ব্যর্থ! মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const cleanMobile = normalizeMobile(mobile);
    if (!cleanMobile) {
      toast.error('মোবাইল নম্বর দিন');
      return;
    }
    if (cleanMobile.length < 11 || !cleanMobile.startsWith('01')) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)');
      return;
    }
    if (!password) {
      toast.error('পাসওয়ার্ড দিন');
      return;
    }
    if (password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে');
      return;
    }
    if (!recoveryPin || recoveryPin.length !== 4) {
      toast.error('পাসওয়ার্ড উদ্ধারের জন্য ৪ ডিজিটের গোপন রিকভারি পিন সেট করুন');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(cleanMobile, password, recoveryPin);
      if (error) throw error;
      toast.success('সফলভাবে নিবন্ধন হয়েছে! আপনার গোপন পিনটি মনে রাখুন।');
      navigate('/');
    } catch (error: any) {
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        toast.error('এই মোবাইল নম্বরটি আগে থেকেই নিবন্ধিত! লগইন করুন।');
      } else {
        toast.error('নিবন্ধন ব্যর্থ! আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinResetSubmit = async () => {
    const cleanMobile = normalizeMobile(forgotMobile);
    if (!cleanMobile || cleanMobile.length < 11) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    if (!forgotPin || forgotPin.length !== 4) {
      toast.error('৪ ডিজিটের গোপন রিকভারি পিন দিন');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('নতুন পাসওয়ার্ড দুটি মেলেনি!');
      return;
    }

    setForgotLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_password_with_pin', {
        p_mobile: cleanMobile,
        p_pin: forgotPin,
        p_new_password: forgotNewPassword,
      });

      if (error) {
        throw error;
      }

      if (data && (data as any).success === false) {
        toast.error((data as any).message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে');
        return;
      }

      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এবার লগইন করুন।');
      setMobile(cleanMobile);
      setPassword(forgotNewPassword);
      setShowForgotModal(false);
      setForgotPin('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err: any) {
      console.error('PIN Reset error:', err);
      toast.error(err.message || 'পাসওয়ার্ড রিসেট করা যায়নি। পিন মনে না থাকলে এআই সহকারীর সাহায্য নিন।');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-farm text-5xl shadow-lg mb-4"
            whileHover={{ scale: 1.05 }}
          >
            🐔
          </motion.div>
          <h1 className="text-2xl font-bold text-primary">Smart Poultry</h1>
          <p className="text-muted-foreground text-sm mt-1">আপনার খামারের সেরা সঙ্গী</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6 space-y-4">
            {/* Mobile Number Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                মোবাইল নম্বর
              </Label>
              <Input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="font-number"
                autoFocus
              />
              {isSignUp && (
                <p className="text-[11px] text-muted-foreground">
                  আপনার সচল ১১ ডিজিটের মোবাইল নম্বর দিন
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                পাসওয়ার্ড {isSignUp && '(কমপক্ষে ৬ অক্ষর)'}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      isSignUp ? handleSignUp() : handleSignIn();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* 4-Digit Recovery PIN (Shown during Sign Up) */}
            {isSignUp && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 pt-1 pb-1"
              >
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ৪ ডিজিটের রিকভারি পিন (গোপন)
                  </Label>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                    খুব গুরুত্বপূর্ণ
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="যেমন: ১২৩৪"
                    value={recoveryPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      setRecoveryPin(val);
                    }}
                    className="tracking-[0.5em] text-center font-bold text-lg h-11 border-emerald-300 focus-visible:ring-emerald-500 bg-emerald-50/30"
                  />
                  <Key className="w-4 h-4 text-emerald-600/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 leading-tight">
                  <span className="text-emerald-600 font-bold">💡</span>
                  ভবিষ্যতে পাসওয়ার্ড ভুলে গেলে এই ৪ ডিজিটের পিন দিয়ে তাৎক্ষণিক উদ্ধার করতে পারবেন।
                </p>
              </motion.div>
            )}

            {/* Forgot Password Links (Shown during Sign In) */}
            {!isSignUp && (
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMobile(mobile);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAiModal(true);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/80 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  এআই সহকারী
                </button>
              </div>
            )}

            {/* Main Action Button */}
            {isSignUp ? (
              <Button 
                onClick={handleSignUp} 
                className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    অ্যাকাউন্ট তৈরি হচ্ছে...
                  </>
                ) : (
                  'মোবাইল নম্বর দিয়ে সাইন আপ করুন'
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleSignIn} 
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    অপেক্ষা করুন...
                  </>
                ) : (
                  'লগইন করুন'
                )}
              </Button>
            )}

            {/* Or Separator */}
            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                অথবা সরাসরি
              </span>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium gap-2 border-muted-foreground/30 hover:bg-muted/60 shadow-sm"
              size="lg"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5 mr-1" />
              )}
              {isSignUp ? 'Google দিয়ে সরাসরি সাইন আপ করুন' : 'Google দিয়ে সরাসরি লগইন করুন'}
            </Button>

            {/* Bottom Switcher: Sign Up vs Login */}
            <div className="text-center pt-2">
              {isSignUp ? (
                <p className="text-xs text-muted-foreground">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-primary font-semibold hover:underline ml-1"
                  >
                    লগইন করুন
                  </button>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  অ্যাকাউন্ট নেই?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-primary font-semibold hover:underline ml-1"
                  >
                    সাইন আপ করুন
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4-digit PIN Reset Modal (Level 1 Recovery) */}
        <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader className="space-y-1 text-left">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-bold">
                ৪-ডিজিট পিন দিয়ে পাসওয়ার্ড রিসেট
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                সাইন-আপের সময় সেট করা ৪ ডিজিটের গোপন পিন দিয়ে নতুন পাসওয়ার্ড নির্ধারণ করুন।
              </p>
            </DialogHeader>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">মোবাইল নম্বর</Label>
                <Input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={forgotMobile}
                  onChange={(e) => setForgotMobile(e.target.value)}
                  className="h-10 text-sm font-number"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>৪ ডিজিটের সিকিউরিটি পিন</span>
                  <span className="text-[10px] text-muted-foreground">সাইন-আপের সময় দেওয়া</span>
                </Label>
                <Input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="••••"
                  value={forgotPin}
                  onChange={(e) => setForgotPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  className="tracking-[0.4em] text-center font-bold text-base h-10 border-emerald-300 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</Label>
                <div className="relative">
                  <Input
                    type={showForgotPass ? 'text' : 'password'}
                    placeholder="নতুন পাসওয়ার্ড দিন"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowForgotPass(!showForgotPass)}
                  >
                    {showForgotPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">নতুন পাসওয়ার্ড পুনরায় নিশ্চিত করুন</Label>
                <Input
                  type="password"
                  placeholder="আবারও পাসওয়ার্ড লিখুন"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <Button
                type="button"
                className="w-full h-10 font-semibold text-sm mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handlePinResetSubmit}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  'নতুন পাসওয়ার্ড সেভ করুন'
                )}
              </Button>

              {/* AI Assistant Option when PIN is forgotten */}
              <div className="pt-3 border-t text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  গোপন ৪-ডিজিট পিনও মনে নেই?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForgotModal(false);
                    setShowAiModal(true);
                  }}
                  className="w-full text-xs font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 gap-1.5"
                >
                  <Bot className="w-4 h-4 text-emerald-600" />
                  🤖 এআই সহকারী দিয়ে অ্যাকাউন্ট উদ্ধার করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Assistant Modal (Level 2 Recovery when PIN is forgotten) */}
        <AIAssistantModal
          open={showAiModal}
          onOpenChange={setShowAiModal}
          defaultMobile={normalizeMobile(mobile || forgotMobile)}
          onResetSuccess={(m, p) => {
            setMobile(m);
            setPassword(p);
            setIsSignUp(false);
            setShowForgotModal(false);
          }}
        />
      </motion.div>
    </div>
  );
}
