import React from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PoultryBazarHeaderProps {
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  avatarUrl?: string | null;
  isLoggedIn?: boolean;
}

export function PoultryBazarLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg 
      className={`${className} shrink-0 drop-shadow-xs`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Comb (bright red) */}
      <path 
        d="M58 12C58 7 53 4 50 7C47 4 42 4 40 8C37 5 32 7 32 12C32 15 35 18 38 19L54 18C56 16 58 14 58 12Z" 
        fill="#EE0000" 
      />
      {/* Wattle (red) */}
      <path 
        d="M32 36C29 36 27 40 29 43C30 45 33 45 35 42L35 38C35 37 34 36 32 36Z" 
        fill="#EE0000" 
      />
      {/* Chicken Body (clean white with soft contour) */}
      <path 
        d="M48 18C36 18 28 27 28 39C28 48 34 56 40 62C34 65 24 69 16 66C22 74 34 77 42 74C48 79 58 80 66 77C78 72 84 60 84 48C84 32 70 18 48 18Z" 
        fill="#FFFFFF" 
        stroke="#1E293B" 
        strokeWidth="3.2" 
        strokeLinejoin="round" 
      />
      {/* Eye */}
      <circle cx="40" cy="28" r="3.5" fill="#0F172A" />
      <circle cx="41.5" cy="27" r="1.2" fill="#FFFFFF" />
      {/* Beak */}
      <path 
        d="M29 30L18 34.5L29 39Z" 
        fill="#F59E0B" 
        stroke="#D97706" 
        strokeWidth="1.5" 
      />
      {/* Wing Contour */}
      <path 
        d="M52 38C61 38 68 45 65 55C59 61 50 60 47 52C44 45 47 38 52 38Z" 
        fill="#F8FAFC" 
        stroke="#64748B" 
        strokeWidth="2.2" 
      />
      {/* Tail feathers hint */}
      <path 
        d="M74 36C80 32 86 35 88 40" 
        stroke="#64748B" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      {/* Legs & Feet */}
      <path 
        d="M45 75L43 88M45 88L38 88M43 88L48 88M57 75L57 88M57 88L51 88M57 88L63 88" 
        stroke="#F59E0B" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

export function PoultryBazarHeader({
  onOpenMenu,
  onOpenProfile,
  avatarUrl,
  isLoggedIn = false,
}: PoultryBazarHeaderProps) {
  return (
    <header className="w-full bg-card/95 backdrop-blur-md border-b border-border/60 py-2.5 px-3 sm:px-4 transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
        {/* Left: Hamburger Menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-xl text-foreground hover:bg-muted/80 shrink-0 cursor-pointer"
          aria-label="মেনু খুলুন"
        >
          <Menu className="w-6 h-6 text-foreground/90 stroke-[2.2]" />
        </Button>

        {/* Center: Logo & Poultry BAZAR Branding */}
        <div className="flex items-center gap-2 select-none min-w-0">
          <PoultryBazarLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            {/* Top Brand Name: Poultry (Green) + BAZAR (Red) */}
            <div className="flex items-baseline tracking-tight font-black">
              <span className="text-[#009933] dark:text-emerald-400 text-lg sm:text-[22px] font-black tracking-tight">
                Poultry
              </span>
              <span className="text-[#EE0000] dark:text-red-500 text-lg sm:text-[22px] font-black tracking-tight ml-1">
                BAZAR
              </span>
            </div>

            {/* Subtitle Tagline: কিনুন,বেচুন,খুশি থাকুন */}
            <div className="flex items-center text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight">
              <span className="text-[#EE0000] dark:text-red-400">কিনুন,</span>
              <span className="text-[#009933] dark:text-emerald-400">বেচুন,</span>
              <span className="text-[#009933] dark:text-emerald-400 ml-0.5">খুশি থাকুন</span>
            </div>
          </div>
        </div>

        {/* Right: Circular Profile Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenProfile}
          className="w-10 h-10 rounded-full p-0.5 border-2 border-border/80 hover:border-emerald-500/60 bg-muted/30 hover:bg-muted shrink-0 transition-all cursor-pointer overflow-hidden shadow-2xs"
          aria-label="প্রোফাইল খুলুন"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
          )}
        </Button>
      </div>
    </header>
  );
}
