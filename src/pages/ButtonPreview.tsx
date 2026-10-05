import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, ChevronDown, Check, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ButtonPreview() {
  const navigate = useNavigate();
  const [selectedStyle, setSelectedStyle] = useState<string>(() => {
    return localStorage.getItem('header_button_variant') || '2';
  });

  const handleApply = (styleId: string, name: string) => {
    localStorage.setItem('header_button_variant', styleId);
    setSelectedStyle(styleId);
    toast.success(`'${name}' সফলভাবে অ্যাপে সেট করা হয়েছে!`);
  };

  const variants = [
    {
      id: '1',
      name: 'ডিজাইন ১: সলিড এমারেল্ড লগইন',
      tag: 'পরিষ্কার ও অ্যাকশন-ভিত্তিক',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'সলিড সবুজ ব্যাকগ্রাউন্ড ও সাদা টেক্সট। বাইরে কোনো "গেস্ট" শব্দ থাকবে না, ব্যবহারকারী সরাসরি লগইন করার জন্য স্পষ্ট বাটন দেখতে পাবেন।',
      renderButton: () => (
        <Button 
          variant="default" 
          size="sm" 
          className="h-8.5 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition-all gap-1.5 border border-emerald-500/40"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>লগইন করুন</span>
          <ChevronDown className="w-3 h-3 text-emerald-100 ml-0.5" />
        </Button>
      ),
    },
    {
      id: '2',
      name: 'ডিজাইন ২: টু-টোন স্মার্ট ক্যাপসুল ⭐ (রিকমেন্ডেড)',
      tag: 'আধুনিক ফিনটেক স্টাইল',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'বামে অ্যাম্বার পালস ডট সহ "গেস্ট" স্ট্যাটাস, আর ডান পাশে প্রিমিয়াম সবুজ "লগইন" বাটন। দেখতে সবচেয়ে আধুনিক ও প্রফেশনাল।',
      renderButton: () => (
        <div className="inline-flex items-center h-8.5 rounded-full border border-emerald-500/30 bg-card p-0.5 shadow-2xs hover:border-emerald-500/60 transition-all cursor-pointer">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>গেস্ট</span>
          </div>
          <div className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors">
            <span>লগইন</span>
            <ChevronDown className="w-3 h-3 text-emerald-100" />
          </div>
        </div>
      ),
    },
    {
      id: '3',
      name: 'ডিজাইন ৩: মিনিমাল প্রোফাইল অবতার',
      tag: 'সবচেয়ে ছিমছাম',
      tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'কোনো বড় লেখা থাকবে না। শুধু একটি আধুনিক গোল প্রোফাইল আইকন, যার কর্নারে একটি ছোট অ্যাম্বার ডট জ্বলবে। হেডারের জায়গা একদম খোলামেলা থাকে।',
      renderButton: () => (
        <div className="relative inline-flex items-center justify-center p-1 rounded-full border border-border/70 hover:border-primary/40 bg-card hover:bg-muted/60 transition-all cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-background animate-pulse" />
        </div>
      ),
    },
    {
      id: '4',
      name: 'ডিজাইন ৪: অ্যাকাউন্ট পিল বাটন',
      tag: 'মার্জিত ও ফরমাল',
      tagColor: 'bg-sky-100 text-sky-800 border-sky-300',
      description: 'মার্জিত সফট আউটলাইন বাটন। এতে শুধু "অ্যাকাউন্ট" লেখা থাকে। চাপ দিলে ড্রপডাউনে লগইন ও সেটিংস প্রদর্শিত হয়।',
      renderButton: () => (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8.5 px-3 rounded-full border-border/80 hover:border-primary/40 bg-card hover:bg-primary/5 text-foreground font-semibold text-xs shadow-2xs gap-1.5 transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <span>অ্যাকাউন্ট</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top bar navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            মূল ড্যাশবোর্ডে ফিরে যান
          </Button>
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            লাইভ ইউআই চয়েজার
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">
            হেডারের ৪টি আধুনিক বাটন ডিজাইন
          </h1>
          <p className="text-sm text-muted-foreground">
            আপনার পছন্দের ডিজাইনটি বেছে নিয়ে নিচে 'এই ডিজাইনটি সেট করুন' বাটনে চাপুন:
          </p>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          {variants.map((v) => {
            const isCurrent = selectedStyle === v.id;
            return (
              <div 
                key={v.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent 
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                    : 'border-border bg-card hover:border-border/80 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{v.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v.tagColor}`}>
                        {v.tag}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{v.description}</p>
                  </div>

                  <Button
                    size="sm"
                    variant={isCurrent ? "default" : "outline"}
                    className={`h-8 text-xs font-semibold shrink-0 gap-1.5 ${
                      isCurrent ? "bg-primary text-primary-foreground" : "border-primary/40 text-primary hover:bg-primary/10"
                    }`}
                    onClick={() => handleApply(v.id, v.name)}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        বর্তমানে সক্রিয়
                      </>
                    ) : (
                      'এই ডিজাইনটি সেট করুন'
                    )}
                  </Button>
                </div>

                {/* Simulated Header Preview */}
                <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-2">
                  {/* Left Brand */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
                      🐔
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground truncate">
                          Smart Poultry
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 px-1 py-0.5 rounded-full border border-emerald-500/25 shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          সুরক্ষিত
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">
                        আপনার খামারের হিসাব আজীবন নিরাপদ 🛡️
                      </span>
                    </div>
                  </div>

                  {/* Right Button Preview */}
                  <div className="shrink-0">
                    {v.renderButton()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back button bottom */}
        <div className="text-center pt-2">
          <Button 
            className="w-full sm:w-auto font-semibold text-sm px-6 h-10 shadow-sm"
            onClick={() => navigate('/')}
          >
            অ্যাপের ড্যাশবোর্ডে গিয়ে ফলাফল দেখুন ➔
          </Button>
        </div>
      </div>
    </div>
  );
}
