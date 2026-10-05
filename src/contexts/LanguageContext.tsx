import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'bn' | 'en';

export const translations = {
  bn: {
    // Header & Brand
    appName: 'Smart Poultry',
    tagline: 'আপনার খামারের হিসাব আজীবন নিরাপদ 🛡️',
    allFarmRecordsInOnePlace: 'আপনার খামারের সম্পূর্ণ হিসাব এক জায়গায়',
    secured: 'সুরক্ষিত',
    login: 'লগইন',
    loginNow: 'লগইন করুন',
    loginOrGuest: 'লগইন / গেস্ট',
    guest: 'গেস্ট',
    guestMode: 'গেস্ট মোড',
    unsecured: 'অসংরক্ষিত',
    account: 'অ্যাকাউন্ট',
    guestDesc: 'আপনার খামারের হিসাব আজীবন সুরক্ষিত রাখতে একটি ফ্রি অ্যাকাউন্ট তৈরি করুন।',
    guestAccountNotice: 'আপনি বর্তমানে অতিথি হিসেবে ব্যবহার করছেন। আপনার স্থায়ী প্রোফাইল ও ক্লাউড সিঙ্ক পেতে লগইন করুন।',
    loginOrSignUp: 'লগইন বা সাইন আপ করুন',
    profile: 'প্রোফাইল',
    active: 'সক্রিয়',
    user: 'ব্যবহারকারী',
    notLoggedIn: 'লগইন করা নেই',
    myPoultry: 'আমার পোল্ট্রি',
    poultrySettings: 'আমার মুরগি (সেটিংস)',
    accountInfo: 'অ্যাকাউন্ট তথ্য',
    accountStatus: 'অ্যাকাউন্ট স্ট্যাটাস',
    uploadPhoto: 'ছবি আপলোড',
    settings: 'সেটিংস',
    theme: 'থিম',
    light: 'লাইট',
    dark: 'ডার্ক',
    systemTheme: 'সিস্টেম',
    language: 'ভাষা',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    bengaliName: 'বাংলা (Bengali)',
    bengaliDesc: 'ডিফল্ট ভাষা',
    englishName: 'English',
    englishDesc: 'আন্তর্জাতিক ভাষা',
    defaultText: 'ডিফল্ট',
    driveBackup: 'Google Drive ব্যাকআপ',
    loginRequired: 'লগইন প্রয়োজন',
    logout: 'লগআউট',
    loggedOutSuccess: 'লগআউট হয়েছে',
    smartAiAssistant: 'স্মার্ট এআই সহকারী',
    aiGuideSubtitle: 'হিসাব বুঝতে সাহায্য ও গাইড',
    
    // Drive
    driveStatus: 'Google Drive স্ট্যাটাস',
    driveConnectedLive: '✓ লাইভ অটো-ব্যাকআপ সক্রিয়',
    driveNotConnected: 'সংযুক্ত নয়',
    driveLoginNoticeTitle: 'লগইন ছাড়া ড্রাইভ কানেক্ট সম্ভব নয়',
    driveLoginNoticeDesc: 'আপনার খামারের সকল হিসাব স্বয়ংক্রিয়ভাবে নিজের গুগল ড্রাইভে নিরাপদে রাখতে এবং লাইভ সিঙ্ক সুবিধা পেতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।',
    driveAutoSyncTip: '💡 যেকোনো হিসাব পরিবর্তন হলে স্বয়ংক্রিয়ভাবে Google Drive-এ লাইভ সিঙ্ক হচ্ছে।',
    lastSync: 'সর্বশেষ সিঙ্ক',
    backupNow: 'এখনই ব্যাকআপ',
    restoreDrive: 'ড্রাইভ রিস্টোর',
    disconnectDrive: 'সংযোগ বিচ্ছিন্ন করুন',
    connectDrive: 'Google Drive কানেক্ট করুন',
    drivePromoDesc: 'আপনার খামারের সকল হিসাব স্বয়ংক্রিয়ভাবে নিজের গুগল ড্রাইভে নিরাপদে রাখতে Google Drive কানেক্ট করুন।',

    // Tabs
    charts: 'চার্ট',
    expenses: 'খরচ',
    sales: 'বিক্রি',
    flock: 'মুরগি',
    medicine: 'ওষুধ',
    feed: 'খাদ্য',
    production: 'উৎপাদন',
    mortality: 'মৃত্যু',
    dealer: 'ডিলার',
    medicineExpense: 'ওষুধ খরচ',
    miscExpense: 'অন্যান্য খরচ',
    misc: 'অন্যান্য',
    report: 'রিপোর্ট',
    batch: 'ব্যাচ',
    pdfReport: 'পিডিএফ রিপোর্ট',
    dataExport: 'ব্যাকআপ/এক্সপোর্ট',
    
    // Financial Summary
    monthlyProfit: 'মাসিক লাভ',
    monthlyLoss: 'মাসিক লোকসান',
    totalIncome: 'মোট আয়',
    totalExpense: 'মোট ব্যয়',
    doingWell: '📈 ভালো চলছে!',
    reduceCost: '📉 খরচ কমাতে হবে',
    monthCalculation: 'এর হিসাব',
    
    // Auth & Passwords
    changePassword: 'পাসওয়ার্ড পরিবর্তন',
    changePasswordBtn: 'পাসওয়ার্ড পরিবর্তন করুন',
    currentPassword: 'বর্তমান পাসওয়ার্ড',
    newPassword: 'নতুন পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    saveNewPassword: 'নতুন পাসওয়ার্ড সেভ করুন',
    enterNewPassword: 'নতুন পাসওয়ার্ড দিন',
    reEnterPassword: 'আবার পাসওয়ার্ড দিন',
    changingPassword: 'পরিবর্তন হচ্ছে...',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    recoveryPin: '৪ ডিজিটের রিকভারি পিন',
    mobileNumber: 'মোবাইল নম্বর',
    enterMobile: 'মোবাইল নম্বর দিন',
    enterPassword: 'পাসওয়ার্ড দিন',
    
    // Setup Wizard
    welcomeToApp: 'Smart Poultry-এ স্বাগতম',
    setupFarmSteps: 'আপনার খামার সেটআপ করতে কয়েকটি ধাপ',
    whichPoultryType: 'আপনি কোন ধরনের মুরগি পালন করছেন?',
    farmInfo: 'খামারের তথ্য',
    farmName: 'খামারের নাম',
    farmLocationOpt: 'খামারের ঠিকানা (ঐচ্ছিক)',
    continueBtn: 'চালিয়ে যান',
    backBtn: 'পেছনে',
    startBtn: 'শুরু করুন',
    firstBatchTitle: 'প্রথম ব্যাচ তৈরি করুন',
    batchName: 'ব্যাচের নাম',
    arrivalDate: 'আগমনের তারিখ',
    initialBirdCount: 'প্রাথমিক মুরগির সংখ্যা',
    pricePerChick: 'প্রতি বাচ্চার দাম (৳)',
    totalPurchaseCost: 'মোট ক্রয় মূল্য (৳)',
    autoCalculated: '(স্বয়ংক্রিয় হিসাব)',
    selectHatcheryOpt: 'হ্যাচারি / সরবরাহকারী (ঐচ্ছিক)',
    
    // Notifications
    languageSwitchedBn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে',
    languageSwitchedEn: 'Language switched to English',
  },
  en: {
    // Header & Brand
    appName: 'Smart Poultry',
    tagline: 'Your farm records safe forever 🛡️',
    allFarmRecordsInOnePlace: 'All your farm records in one place',
    secured: 'Secured',
    login: 'Log In',
    loginNow: 'Log In Now',
    loginOrGuest: 'Log In / Guest',
    guest: 'Guest',
    guestMode: 'Guest Mode',
    unsecured: 'Unsaved',
    account: 'Account',
    guestDesc: 'Create a free account to keep your poultry farm records safe forever.',
    guestAccountNotice: 'You are currently using guest mode. Please log in for a permanent profile and cloud sync.',
    loginOrSignUp: 'Log In or Sign Up',
    profile: 'Profile',
    active: 'Active',
    user: 'User',
    notLoggedIn: 'Not Logged In',
    myPoultry: 'My Poultry',
    poultrySettings: 'Poultry Settings',
    accountInfo: 'Account Info',
    accountStatus: 'Account Status',
    uploadPhoto: 'Upload Photo',
    settings: 'Settings',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    systemTheme: 'System',
    language: 'Language',
    selectLanguage: 'Select Language',
    bengaliName: 'বাংলা (Bengali)',
    bengaliDesc: 'Default language',
    englishName: 'English',
    englishDesc: 'International language',
    defaultText: 'Default',
    driveBackup: 'Google Drive Backup',
    loginRequired: 'Login required',
    logout: 'Log Out',
    loggedOutSuccess: 'Logged out successfully',
    smartAiAssistant: 'Smart AI Assistant',
    aiGuideSubtitle: 'Help with calculations & guide',
    
    // Drive
    driveStatus: 'Google Drive Status',
    driveConnectedLive: '✓ Live auto-backup active',
    driveNotConnected: 'Not Connected',
    driveLoginNoticeTitle: 'Login required to connect Drive',
    driveLoginNoticeDesc: 'To automatically keep all farm records safe in your own Google Drive with live sync, please log in to your account first.',
    driveAutoSyncTip: '💡 Live syncing changes automatically with Google Drive.',
    lastSync: 'Last synced',
    backupNow: 'Backup Now',
    restoreDrive: 'Restore Drive',
    disconnectDrive: 'Disconnect Drive',
    connectDrive: 'Connect Google Drive',
    drivePromoDesc: 'Connect Google Drive to safely keep all your farm records in your own Google account.',

    // Tabs
    charts: 'Charts',
    expenses: 'Expenses',
    sales: 'Sales',
    flock: 'Flock',
    medicine: 'Medicine',
    feed: 'Feed',
    production: 'Production',
    mortality: 'Mortality',
    dealer: 'Dealer',
    medicineExpense: 'Medicine Cost',
    miscExpense: 'Misc Expense',
    misc: 'Others',
    report: 'Report',
    batch: 'Batch',
    pdfReport: 'PDF Report',
    dataExport: 'Backup / Export',
    
    // Financial Summary
    monthlyProfit: 'Monthly Profit',
    monthlyLoss: 'Monthly Loss',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    doingWell: '📈 Doing well!',
    reduceCost: '📉 Need to cut costs',
    monthCalculation: 'Records',
    
    // Auth & Passwords
    changePassword: 'Change Password',
    changePasswordBtn: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    saveNewPassword: 'Save New Password',
    enterNewPassword: 'Enter new password',
    reEnterPassword: 'Re-enter password',
    changingPassword: 'Changing...',
    forgotPassword: 'Forgot Password?',
    recoveryPin: '4-Digit Recovery PIN',
    mobileNumber: 'Mobile Number',
    enterMobile: 'Enter mobile number',
    enterPassword: 'Enter password',
    
    // Setup Wizard
    welcomeToApp: 'Welcome to Smart Poultry',
    setupFarmSteps: 'Few steps to set up your poultry farm',
    whichPoultryType: 'Which poultry type are you farming?',
    farmInfo: 'Farm Information',
    farmName: 'Farm Name',
    farmLocationOpt: 'Farm Address (Optional)',
    continueBtn: 'Continue',
    backBtn: 'Back',
    startBtn: 'Start',
    firstBatchTitle: 'Create First Batch',
    batchName: 'Batch Name',
    arrivalDate: 'Arrival Date',
    initialBirdCount: 'Initial Chick Count',
    pricePerChick: 'Price per Chick (৳)',
    totalPurchaseCost: 'Total Purchase Cost (৳)',
    autoCalculated: '(Auto Calculated)',
    selectHatcheryOpt: 'Hatchery / Supplier (Optional)',
    
    // Notifications
    languageSwitchedBn: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে',
    languageSwitchedEn: 'Language switched to English',
  }
};

export type TranslationKey = keyof typeof translations.bn;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app_language') as Language) || 'bn';
    }
    return 'bn';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_language', newLang);
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[language] || translations.bn;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Fallback if rendered outside provider
    return {
      language: 'bn' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey, fallback?: string) => translations.bn[key] || fallback || key,
    };
  }
  return context;
}
