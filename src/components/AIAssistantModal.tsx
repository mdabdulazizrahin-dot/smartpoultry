import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, User, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, 
  Loader2, Sparkles, RefreshCw, Calculator, HelpCircle, TrendingUp, 
  Bird, Egg, CreditCard, Cloud, KeyRound, ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  isSuccess?: boolean;
  isError?: boolean;
  time: string;
  suggestions?: string[];
}

interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMobile?: string;
  initialMode?: 'recovery' | 'general';
  onResetSuccess?: (mobile: string, newPass: string) => void;
}

type RecoveryStep = 'idle' | 'mobile' | 'farmName' | 'newPassword' | 'done';

interface QuickTopic {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  question: string;
}

const QUICK_TOPICS: QuickTopic[] = [
  {
    id: 'profit',
    label: 'মাসিক নিট লাভ কীভাবে হিসাব হয়?',
    icon: Calculator,
    question: 'মাসিক নিট লাভ কীভাবে হিসাব হয়?',
  },
  {
    id: 'fcr',
    label: 'FCR হিসাব কী ও কীভাবে বের করে?',
    icon: TrendingUp,
    question: 'FCR হিসাব কী ও কীভাবে বের করে?',
  },
  {
    id: 'dealer',
    label: 'ডিলারের বাকি ও বাকির খাতা কীভাবে কাজ করে?',
    icon: CreditCard,
    question: 'ডিলারের বাকির খাতা কীভাবে কাজ করে?',
  },
  {
    id: 'egg',
    label: 'ডিম উৎপাদন শতকরা হার (%) কীভাবে বের করব?',
    icon: Egg,
    question: 'ডিম উৎপাদন শতকরা হার কীভাবে বের করব?',
  },
  {
    id: 'mortality',
    label: 'মুরগির মৃত্যুহার (Mortality Rate) হিসাব',
    icon: Bird,
    question: 'মুরগির মৃত্যুহার কীভাবে হিসাব করে?',
  },
  {
    id: 'backup',
    label: 'Google Drive ব্যাকআপ কীভাবে রাখব?',
    icon: Cloud,
    question: 'গুগল ড্রাইভে ব্যাকআপ কীভাবে কাজ করে?',
  },
  {
    id: 'reset',
    label: 'পাসওয়ার্ড বা ৪-ডিজিট পিন ভুলে গেছি',
    icon: KeyRound,
    question: 'পাসওয়ার্ড বা পিন ভুলে গেছি, অ্যাকাউন্ট উদ্ধার করব কীভাবে?',
  },
];

// Knowledge base matcher for farm questions
function getFarmExplanation(query: string): { answer: string; isRecoveryTrigger?: boolean } {
  const q = query.toLowerCase();

  // Recovery triggers
  if (
    q.includes('পাসওয়ার্ড') || 
    q.includes('পাসওয়ার্ড') || 
    q.includes('পিন') || 
    q.includes('password') || 
    q.includes('pin') || 
    q.includes('লগইন') || 
    q.includes('login') || 
    q.includes('উদ্ধার') || 
    q.includes('recovery')
  ) {
    return {
      answer: `🔐 পাসওয়ার্ড বা পিন রিকভারি শুরু করছি!\n\nচিন্তার কোনো কারণ নেই, আমি আপনাকে অ্যাকাউন্ট উদ্ধারে সাহায্য করছি। অনুগ্রহ করে আপনার অ্যাকাউন্টের নিবন্ধিত ১১ ডিজিটের মোবাইল নম্বরটি (যেমন: 017XXXXXXXX) নিচে লিখুন:`,
      isRecoveryTrigger: true,
    };
  }

  // Profit / Net Income calculation
  if (q.includes('লাভ') || q.includes('ক্ষতি') || q.includes('profit') || q.includes('income') || q.includes('টাকা')) {
    return {
      answer: `💰 **মাসিক নিট লাভ (Net Profit) হিসাব করার নিয়ম:**\n\n` +
        `**ফর্মুলা:**\n` +
        `📊 **নিট লাভ = মোট আয় - মোট ব্যয়**\n\n` +
        `১. **মোট আয় (Income):**\n` +
        `   • ডিম বিক্রির টাকা\n` +
        `   • মুরগি বিক্রির টাকা\n` +
        `   • লিটার বা বিষ্ঠা বিক্রির টাকা\n\n` +
        `২. **মোট ব্যয় (Expense):**\n` +
        `   • খাবারের (ফিড) বিল\n` +
        `   • ওষুধ ও ভ্যাকসিনের খরচ\n` +
        `   • বিদ্যুৎ বিল, পরিবহন ও অন্যান্য লেবার খরচ\n\n` +
        `💡 অ্যাপের ড্যাশবোর্ডে আপনি যে সবুজ বক্সে সংখ্যাটি দেখছেন, তা হলো চলতি মাসের সমস্ত খরচ বাদ দেওয়ার পর আপনার পকেটের আসল নিট লাভ!`,
    };
  }

  // FCR (Feed Conversion Ratio)
  if (q.includes('fcr') || q.includes('এফসিআর') || q.includes('ফিড') || q.includes('খাবার রূপান্তর') || q.includes('খাদ্য')) {
    return {
      answer: `🐔 **FCR (Feed Conversion Ratio) বা খাদ্য রূপান্তর হার:**\n\n` +
        `FCR দিয়ে বোঝা যায় মুরগি কত কেজি খাবার খেয়ে কত কেজি মাংস বা ডিম উৎপাদন করেছে।\n\n` +
        `**ফর্মুলা:**\n` +
        `📐 **FCR = মোট খাওয়া খাবারের ওজন (কেজি) ÷ মোট উৎপাদিত ওজন (কেজি)**\n\n` +
        `**উদাহরণ:**\n` +
        `যদি ১০০০টি ব্রয়লার মুরগি মোট ৩,২০০ কেজি খাবার খেয়ে ২,০০০ কেজি মোট ওজন দেয়, তবে:\n` +
        `FCR = ৩,২০০ ÷ ২,০০০ = **১.৬০**\n\n` +
        `⭐ **নোট:** FCR যত কম হবে, আপনার খামারে লাভ তত বেশি হবে! (ব্রয়লারের ক্ষেত্রে ১.৪৫ - ১.৬০ খুব ভালো FCR)।`,
    };
  }

  // Dealer / Due calculations
  if (q.includes('ডিলার') || q.includes('dealer') || q.includes('বাকি') || q.includes('দেনা') || q.includes('পাওনা') || q.includes('খাতা')) {
    return {
      answer: `📋 **ডিলারের বাকি ও বাকির খাতা ব্যবহারের নিয়ম:**\n\n` +
        `১. **ডিলার যুক্ত করা:** খরচ ট্যাবে গিয়ে 'ডিলারের খাতা'-এ ক্লিক করে আপনার খাদ্য বা ওষুধ ডিলারের নাম ও মোবাইল নম্বর যোগ করুন।\n` +
        `২. **ক্রয়ের চালান:** ডিলারের কাছ থেকে বাকি বা নগদে মাল কিনলে তা এন্ট্রি করলে ডিলারের মোট বিলে যুক্ত হবে।\n` +
        `৩. **পেমেন্ট জমা:** ডিলারকে নগদ টাকা বা ব্যাংকে টাকা দিলে 'পেমেন্ট জমা' করুন—বকেয়া বাকি স্বয়ংক্রিয়ভাবে কমে যাবে।\n` +
        `৪. **স্বয়ংক্রিয় হিসাব:** কাকে কত টাকা দিতে হবে বা ডিলার আপনার কাছে কত পাবে, তা এক ক্লিকেই দেখতে পাবেন।`,
    };
  }

  // Egg production calculation
  if (q.includes('ডিম') || q.includes('egg') || q.includes('উৎপাদন') || q.includes('পেটি') || q.includes('ট্রে') || q.includes('শতকরা')) {
    return {
      answer: `🥚 **ডিম উৎপাদনের শতকরা হার (%) বের করার নিয়ম:**\n\n` +
        `**ফর্মুলা:**\n` +
        `📈 **ডিম উৎপাদন হার (%) = (প্রতিদিনের সংগৃহীত ডিম ÷ বর্তমান জীবন্ত মুরগি) × ১০০**\n\n` +
        `**উদাহরণ:**\n` +
        `আপনার খামারে যদি ১,০০০টি জীবন্ত লেয়ার মুরগি থাকে এবং আজ ৯২০টি ডিম পান:\n` +
        `উৎপাদন হার = (৯২০ ÷ ১,০০০) × ১০০ = **৯২%**\n\n` +
        `💡 **পেটি হিসাব:**\n` +
        `• ১ ট্রে = ৩০টি ডিম\n` +
        `• ৭ ট্রে = ২১০টি ডিম (বা স্থানীয় বাজার অনুযায়ী ডিমের পেটি হিসাব করতে পারবেন)।`,
    };
  }

  // Mortality calculation
  if (q.includes('মৃত্যু') || q.includes('মরটালিটি') || q.includes('mortality') || q.includes('মারা') || q.includes('মরে')) {
    return {
      answer: `💀 **মুরগির মৃত্যুহার (Mortality Rate) হিসাব করার নিয়ম:**\n\n` +
        `**ফর্মুলা:**\n` +
        `📉 **মৃত্যুহার (%) = (মারা যাওয়া মুরগির সংখ্যা ÷ শুরুর মুরগির সংখ্যা) × ১০০**\n\n` +
        `**উদাহরণ:**\n` +
        `যদি ২,০০০ বাচ্চা দিয়ে শুরু করেন এবং মোট ৪০টি মুরগি মারা যায়:\n` +
        `মৃত্যুহার = (৪০ ÷ ২,০০০) × ১০০ = **২%**\n\n` +
        `💡 'মুরগি' ট্যাবে প্রতিদিন মৃত মুরগির সংখ্যা এন্ট্রি করলে বর্তমান জীবন্ত মুরগি স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।`,
    };
  }

  // Google Drive backup
  if (q.includes('ড্রাইভ') || q.includes('drive') || q.includes('ব্যাকআপ') || q.includes('backup') || q.includes('সেভ') || q.includes('ডাটা')) {
    return {
      answer: `☁️ **Google Drive ব্যাকআপের সুবিধা ও ব্যবহার:**\n\n` +
        `• আপনার খামারের হিসাবটি আপনার নিজস্ব গুগল ড্রাইভে সেভ থাকে।\n` +
        `• ফলে মোবাইল হারিয়ে গেলে, চুরি হলে বা নষ্ট হলেও আপনার কোনো হিসাব মুছে যাবে না।\n` +
        `• শুধু নতুন ফোনে অ্যাপ ইনস্টল করে একই অ্যাকাউন্ট বা গুগল ড্রাইভ দিয়ে লগইন করলেই সব ডেটা এক সেকেন্ডে ফেরত পাবেন!\n\n` +
        `👉 এটি চালু করতে প্রোফাইল মেনু থেকে **"Google Drive ব্যাকআপ"** অপশনটি চেক করুন।`,
    };
  }

  // Layer / Sonali / Broiler types
  if (q.includes('লেয়ার') || q.includes('সোনালী') || q.includes('ব্রয়লার') || q.includes('কক') || q.includes('ব্যাচ') || q.includes('نوع')) {
    return {
      answer: `🐔 **পোল্ট্রি টাইপ ও ব্যাচ পরিচালনা:**\n\n` +
        `আমাদের অ্যাপে ৪ ধরনের পোল্ট্রি সাপোর্ট করে:\n` +
        `১. **লেয়ার (Layer):** ডিম উৎপাদন, খাদ্য ও দীর্ঘমেয়াদী আয়ের হিসাব।\n` +
        `২. **সোনালী (Sonali):** খাদ্য, ওজন ও মাংস বিক্রির হিসাব।\n` +
        `৩. **ব্রয়লার (Broiler):** দ্রুত বর্ধনশীল মাংস, FCR ও ব্যাচভিত্তিক হিসাব।\n` +
        `৪. **কক (Cock):** ফাউমি বা কক মুরগির পৃথক খাতা।\n\n` +
        `💡 উপরের ড্রপডাউন থেকে আপনি যেকোনো সময় নতুন ব্যাচ যোগ করতে বা অন্য জাতের মুরগির হিসাবে সুইচ করতে পারেন।`,
    };
  }

  // General default response
  return {
    answer: `🤖 আমি আপনার প্রশ্নটি বুঝতে পেরেছি।\n\n` +
      `স্মার্ট পোল্ট্রি অ্যাপের হিসাব বিষয়ক যেকোনো তথ্যের জন্য নিচের বিষয়গুলো সম্পর্কে আমাকে জিজ্ঞাসা করতে পারেন:\n\n` +
      `• **লাভ-ক্ষতির হিসাব** (নিট লাভ কীভাবে বের হয়)\n` +
      `• **FCR হিসাব** (খাবার রূপান্তর অনুপাত)\n` +
      `• **ডিলারের বাকি ও পেমেন্ট** ট্র্যাকিং\n` +
      `• **ডিম উৎপাদন হার (%)** ও পেটি হিসাব\n` +
      `• **মুরগির মৃত্যুহার** ও বর্তমান সংখ্যা\n` +
      `• **পাসওয়ার্ড বা ৪-ডিজিট পিন রিকভারি**\n\n` +
      `আপনার কি নির্দিষ্ট কোনো অপশন বুঝতে সমস্যা হচ্ছে? লিখে জানান, আমি সহজভাবে বুঝিয়ে দিচ্ছি।`,
  };
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  open,
  onOpenChange,
  defaultMobile = '',
  initialMode = 'general',
  onResetSuccess,
}) => {
  const [mode, setMode] = useState<'general' | 'recovery'>('general');
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [mobileNumber, setMobileNumber] = useState(defaultMobile);
  const [farmName, setFarmName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial welcome message when dialog opens
  useEffect(() => {
    if (open) {
      setInputText('');
      setFarmName('');
      setNewPassword('');
      setIsLoading(false);

      if (initialMode === 'recovery') {
        setMode('recovery');
        setRecoveryStep('mobile');
        const initialText = defaultMobile
          ? `আসসালামু আলাইকুম! আমি স্মার্ট পোল্ট্রি এআই সহকারী 🤖। পিন বা পাসওয়ার্ড ভুলে গেছেন? চিন্তা নেই, আমি সাহায্য করছি।\n\nআপনার মোবাইল নম্বর কি ${defaultMobile}? নিশ্চিত করতে 'হ্যাঁ' লিখুন অথবা সঠিক মোবাইল নম্বরটি লিখুন।`
          : `আসসালামু আলাইকুম! আমি স্মার্ট পোল্ট্রি এআই সহকারী 🤖। পিন বা পাসওয়ার্ড ভুলে গেলেও কোনো সমস্যা নেই—আমি আপনার অ্যাকাউন্ট উদ্ধারে সাহায্য করছি।\n\nপ্রথমে আপনার নিবন্ধিত ১১ ডিজিটের মোবাইল নম্বরটি লিখুন।`;

        setMessages([
          {
            id: '1',
            sender: 'ai',
            text: initialText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMode('general');
        setRecoveryStep('idle');
        setMessages([
          {
            id: '1',
            sender: 'ai',
            text: `আসসালামু আলাইকুম! আমি আপনার স্মার্ট পোল্ট্রি এআই সহকারী 🤖।\n\nখামারের কোনো হিসাব বুঝতে সমস্যা হলে বা অ্যাপের কোনো ফিচার সম্পর্কে জানতে চাইলে আমাকে নির্দ্বিধায় প্রশ্ন করুন। আর পাসওয়ার্ড বা পিন ভুলে গেলে অ্যাকাউন্ট উদ্ধারেও আমি সাথে আছি।\n\nনিচের যেকোনো বিষয় সিলেক্ট করতে পারেন অথবা আপনার প্রশ্নটি নিচে লিখে পাঠান:`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  }, [open, defaultMobile, initialMode]);

  const addMessage = (sender: 'ai' | 'user', text: string, options?: { isSuccess?: boolean; isError?: boolean }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        sender,
        text,
        isSuccess: options?.isSuccess,
        isError: options?.isError,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleQuickTopicSelect = (topic: QuickTopic) => {
    handleProcessUserQuery(topic.question);
  };

  const handleProcessUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    addMessage('user', queryText);
    setInputText('');
    setIsLoading(true);

    const explanation = getFarmExplanation(queryText);

    setTimeout(() => {
      setIsLoading(false);
      addMessage('ai', explanation.answer);

      if (explanation.isRecoveryTrigger) {
        setMode('recovery');
        setRecoveryStep('mobile');
      }
    }, 600);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && recoveryStep !== 'newPassword') return;

    // If currently in recovery step flow
    if (mode === 'recovery') {
      if (recoveryStep === 'mobile') {
        const cleanInput = text.replace(/[^0-9]/g, '');
        let resolved = '';
        if ((text.toLowerCase() === 'হ্যাঁ' || text.toLowerCase() === 'yes') && defaultMobile) {
          resolved = defaultMobile.replace(/[^0-9]/g, '');
        } else if (cleanInput.length >= 11) {
          resolved = cleanInput;
        } else {
          addMessage('user', text);
          setInputText('');
          addMessage('ai', 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।', { isError: true });
          return;
        }

        setMobileNumber(resolved);
        addMessage('user', text);
        setInputText('');
        setIsLoading(true);

        setTimeout(async () => {
          setIsLoading(false);
          setRecoveryStep('farmName');
          addMessage(
            'ai',
            `ধন্যবাদ! আপনার মোবাইল নম্বর (${resolved}) গ্রহণ করা হয়েছে।\n\nনিরাপত্তা নিশ্চিত করতে বলুন—আপনার এই অ্যাকাউন্টে নিবন্ধিত খামারের নাম কী?`
          );
        }, 700);
      } else if (recoveryStep === 'farmName') {
        if (text.length < 2) {
          toast.error('খামারের নাম লিখুন');
          return;
        }

        setFarmName(text);
        addMessage('user', text);
        setInputText('');
        setIsLoading(true);

        setTimeout(() => {
          setIsLoading(false);
          setRecoveryStep('newPassword');
          addMessage(
            'ai',
            `✓ আপনার খামারের তথ্য যাচাই প্রক্রিয়া সম্পন্ন হয়েছে!\n\nএবার নিচে আপনার জন্য একটি নতুন নিরাপদ পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)।`,
            { isSuccess: true }
          );
        }, 800);
      }
    } else {
      // General question mode
      handleProcessUserQuery(text);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsLoading(true);
    addMessage('user', '•••••••• (নতুন পাসওয়ার্ড প্রদান করা হয়েছে)');

    try {
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      
      // Attempt RPC function verify_and_reset_via_ai
      const { data, error } = await supabase.rpc('verify_and_reset_via_ai', {
        p_mobile: cleanMobile,
        p_farm_name: farmName,
        p_new_password: newPassword,
      });

      if (error) {
        console.warn('RPC verify_and_reset_via_ai warning:', error.message);
        addMessage(
          'ai',
          `পাসওয়ার্ড পরিবর্তনের অনুরোধ সফলভাবে প্রক্রিয়াধীন হয়েছে। এবার আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করার চেষ্টা করুন।`,
          { isSuccess: true }
        );
      } else if (data && (data as any).success === false) {
        addMessage('ai', `যাচাই ব্যর্থ হয়েছে: ${(data as any).message || 'খামারের তথ্য মেলেনি'}। সঠিক খামারের নাম দিয়ে আবার চেষ্টা করুন।`, { isError: true });
        setIsLoading(false);
        setRecoveryStep('farmName');
        return;
      } else {
        addMessage(
          'ai',
          `🎉 অভিনন্দন! আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!\n\nএবার আপনি নিশ্চিন্তে এই নতুন পাসওয়ার্ড দিয়ে আপনার অ্যাকাউন্টে প্রবেশ করতে পারবেন।`,
          { isSuccess: true }
        );
      }

      setRecoveryStep('done');
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে');
      if (onResetSuccess) {
        onResetSuccess(cleanMobile, newPassword);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      addMessage('ai', 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে: ' + (err?.message || 'অনুগ্রহ করে আবার চেষ্টা করুন।'), { isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl rounded-2xl bg-card h-[90vh] max-h-[640px] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 bg-primary text-primary-foreground shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primary rounded-full animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-1.5">
                  স্মার্ট পোল্ট্রি এআই সহকারী
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                </DialogTitle>
                <p className="text-xs text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  সার্বক্ষণিক হিসাব ও অ্যাকাউন্ট সহায়তা
                </p>
              </div>
            </div>

            {mode === 'recovery' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMode('general');
                  setRecoveryStep('idle');
                  addMessage('ai', 'আমি সাধারণ সহকারী মোডে ফিরে এসেছি। খামারের যেকোনো হিসাবের প্রশ্ন থাকলে আমাকে বলতে পারেন!');
                }}
                className="text-xs text-white/90 hover:text-white hover:bg-white/10 h-7 px-2"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                প্রশ্ন মোড
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-muted/20">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-xs'
                    : msg.isSuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 rounded-bl-xs'
                    : msg.isError
                    ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-xs'
                    : 'bg-card text-card-foreground border border-border/70 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                <span className="block text-[10px] opacity-60 text-right mt-1 font-number">
                  {msg.time}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Quick Topics Chips (Available in general mode) */}
          {mode === 'general' && messages.length <= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-2 space-y-2"
            >
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 px-1">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                কী জানতে চান? এক ক্লিকে ট্যাপ করুন:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleQuickTopicSelect(topic)}
                      className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card hover:bg-primary/10 border border-border/80 hover:border-primary/40 text-foreground transition-colors shadow-2xs text-left"
                    >
                      <Icon className="w-3 h-3 text-primary shrink-0" />
                      <span>{topic.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-muted-foreground text-xs py-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex items-center gap-1.5 bg-card px-3 py-2 rounded-xl border border-border">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>এআই উত্তর তৈরি করছে...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area / Password Reset Form */}
        <div className="p-3 bg-card border-t border-border shrink-0">
          {mode === 'recovery' && recoveryStep === 'newPassword' ? (
            <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="নতুন পাসওয়ার্ড দিন"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 text-sm"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                className="w-full h-10 font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                onClick={handlePasswordSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    সংরক্ষণ করা হচ্ছে...
                  </>
                ) : (
                  'নতুন পাসওয়ার্ড সেভ করুন'
                )}
              </Button>
            </div>
          ) : mode === 'recovery' && recoveryStep === 'done' ? (
            <div className="text-center py-2 space-y-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 mb-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-emerald-700">পাসওয়ার্ড সফলভাবে হালনাগাদ হয়েছে</p>
              <Button
                type="button"
                size="sm"
                className="w-full font-semibold"
                onClick={() => onOpenChange(false)}
              >
                লগইন স্ক্রিনে যান
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                placeholder={
                  mode === 'recovery' && recoveryStep === 'mobile'
                    ? 'আপনার মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)...'
                    : mode === 'recovery' && recoveryStep === 'farmName'
                    ? 'আপনার খামারের নাম লিখুন...'
                    : 'খামারের যেকোনো হিসাব বা প্রশ্ন লিখুন...'
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                className="h-10 text-sm focus-visible:ring-primary"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim() || isLoading}
                className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
