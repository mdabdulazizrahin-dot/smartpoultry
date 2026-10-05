import { useState, useEffect, useCallback, useRef } from 'react';
import { FarmData, MonthlyExpense, EggSale, MedicineSchedule, Dealer, DealerPayment, FlockInfo, MortalityRecord, FeedPurchase, EggProduction, MedicinePurchase, MiscExpense, LayerBatch, LayerBatchSnapshot } from '@/types/farm';
import { addDays, differenceInDays, format, parseISO, differenceInWeeks } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { calculateDailyFeedExpense, calculateDailyFixedExpense, syncEggSaleCalculations } from '@/lib/eggSaleCalculations';
import { uploadBackup, isDriveConnected } from '@/lib/googleDriveBackup';
import { showAppNotification } from '@/lib/notifications';

const defaultMedicineSchedules: MedicineSchedule[] = [
  { 
    id: '1', 
    name: 'LASOTA', 
    type: 'LASOTA',
    intervalDays: 30, 
    firstDate: '', 
    lastGivenDate: '', 
    nextDueDate: '',
    completed: false 
  },
  { 
    id: '2', 
    name: 'KIMI', 
    type: 'KIMI',
    intervalDays: 45, 
    firstDate: '', 
    lastGivenDate: '', 
    nextDueDate: '',
    completed: false 
  },
  { 
    id: '3', 
    name: 'VACCINE', 
    type: 'VACCINE',
    intervalDays: 90, 
    firstDate: '', 
    lastGivenDate: '', 
    nextDueDate: '',
    completed: false 
  },
  { 
    id: '4', 
    name: 'H9N2', 
    type: 'VACCINE',
    intervalDays: 90, 
    firstDate: '', 
    lastGivenDate: '', 
    nextDueDate: '',
    completed: false,
    notes: 'H9N2 দেওয়ার ১৫ দিন পর H5N1 দিতে হবে'
  },
  { 
    id: '5', 
    name: 'H5N1', 
    type: 'VACCINE',
    intervalDays: 90, 
    firstDate: '', 
    lastGivenDate: '', 
    nextDueDate: '',
    completed: false,
    notes: 'H9N2 এর ১৫ দিন পর দিতে হবে'
  },
];

const defaultFlockInfo: FlockInfo = {
  arrivalDate: '',
  initialCount: 0,
  mortalityRecords: [],
  feedPurchases: [],
  eggProductions: [],
  medicinePurchases: [],
  miscExpenses: [],
};

const defaultFarmData: FarmData = {
  farmName: 'Smart Poultry',
  monthlyExpenses: [],
  eggSales: [],
  medicineSchedules: defaultMedicineSchedules,
  dealers: [],
  flockInfo: defaultFlockInfo,
};

// Helper to migrate data - add missing schedules and flockInfo
const migrateData = (data: FarmData): FarmData => {
  const existingScheduleNames = data.medicineSchedules.map(m => m.name);
  const missingSchedules = defaultMedicineSchedules.filter(
    defaultSchedule => !existingScheduleNames.includes(defaultSchedule.name)
  );
  
  let migratedData = data;
  
  if (missingSchedules.length > 0) {
    migratedData = {
      ...migratedData,
      medicineSchedules: [...migratedData.medicineSchedules, ...missingSchedules]
    };
  }
  
  // Add flockInfo if missing
  if (!migratedData.flockInfo) {
    migratedData = {
      ...migratedData,
      flockInfo: defaultFlockInfo,
    };
  }

  // Batch migration: put all existing layer data into the first batch
  if (!migratedData.layerBatches || migratedData.layerBatches.length === 0) {
    const firstId = 'batch-1';
    migratedData = {
      ...migratedData,
      layerBatches: [{ id: firstId, name: 'ব্যাচ ১', createdAt: new Date().toISOString() }],
      activeLayerBatchId: firstId,
    };
  }
  if (!migratedData.activeLayerBatchId || !migratedData.layerBatches.some(b => b.id === migratedData.activeLayerBatchId)) {
    migratedData = { ...migratedData, activeLayerBatchId: migratedData.layerBatches[0].id };
  }

  return syncEggSaleCalculations(migratedData);
};

const CUSTOM_FARM_NAME_KEY = 'smart_poultry_farm_name';

const getStoredFarmName = (): string => {
  const custom = localStorage.getItem(CUSTOM_FARM_NAME_KEY);
  if (custom && custom.trim() && custom.trim() !== 'Smart Poultry') {
    return custom.trim();
  }
  try {
    const raw = localStorage.getItem('poultryFarmData');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.farmName && parsed.farmName.trim() && parsed.farmName.trim() !== 'Smart Poultry') {
        return parsed.farmName.trim();
      }
    }
  } catch (e) {}
  return defaultFarmData.farmName;
};

export function useFarmData() {
  const { user } = useAuth();
  const [farmData, setFarmData] = useState<FarmData>(() => {
    const saved = localStorage.getItem('poultryFarmData');
    const initialName = getStoredFarmName();
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as FarmData;
        return migrateData({
          ...parsed,
          farmName: (initialName && initialName !== 'Smart Poultry') ? initialName : (parsed.farmName || defaultFarmData.farmName),
        });
      } catch (e) {
        console.error('Error parsing cached farmData:', e);
      }
    }
    const initial = migrateData(defaultFarmData);
    return { ...initial, farmName: initialName };
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem('poultryFarmData');
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasDataChanged, setHasDataChanged] = useState(false);
  const [reminderDays, setReminderDays] = useState(() => {
    const saved = localStorage.getItem('reminderDays');
    return saved ? parseInt(saved) : 3;
  });
  const isInitialMount = useRef(true);

  // Load data from cloud or localStorage
  useEffect(() => {
    const loadData = async () => {
      if (isInitialMount.current && !localStorage.getItem('poultryFarmData')) {
        setIsLoading(true);
      }
      
      if (user) {
        // Try to load from cloud: farm_data and profiles table in parallel
        const [farmRes, profileRes] = await Promise.all([
          supabase
            .from('farm_data')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('farm_name')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (farmRes.error) {
          console.error('Error loading cloud data:', farmRes.error);
          toast.error('ক্লাউড থেকে ডেটা লোড করতে সমস্যা হয়েছে');
        }

        const data = farmRes.data;
        const profile = profileRes.data;

        // Resolve custom farm name: Profile farm_name > poultry_system.farmName > local saved farmName > default
        const cloudFarmName =
          profile?.farm_name?.trim() ||
          ((data as any)?.poultry_system as any)?.farmName?.trim();
        const localCustomName = getStoredFarmName();
        const effectiveFarmName =
          cloudFarmName && cloudFarmName !== 'Smart Poultry'
            ? cloudFarmName
            : localCustomName && localCustomName !== 'Smart Poultry'
            ? localCustomName
            : defaultFarmData.farmName;

        // Read existing local storage data if any
        const savedLocal = localStorage.getItem('poultryFarmData');
        let localParsed: FarmData | null = null;
        if (savedLocal) {
          try {
            localParsed = JSON.parse(savedLocal) as FarmData;
          } catch (e) {
            console.error('Error parsing local farmData during cloud check:', e);
          }
        }

        const hasLocalData = localParsed && (
          (localParsed.monthlyExpenses && localParsed.monthlyExpenses.length > 0) ||
          (localParsed.eggSales && localParsed.eggSales.length > 0) ||
          (localParsed.dealers && localParsed.dealers.length > 0) ||
          (localParsed.flockInfo && (
            (localParsed.flockInfo.initialCount && localParsed.flockInfo.initialCount > 0) ||
            (localParsed.flockInfo.feedPurchases && localParsed.flockInfo.feedPurchases.length > 0) ||
            (localParsed.flockInfo.eggProductions && localParsed.flockInfo.eggProductions.length > 0) ||
            (localParsed.flockInfo.mortalityRecords && localParsed.flockInfo.mortalityRecords.length > 0) ||
            (localParsed.flockInfo.medicinePurchases && localParsed.flockInfo.medicinePurchases.length > 0) ||
            (localParsed.flockInfo.miscExpenses && localParsed.flockInfo.miscExpenses.length > 0)
          )) ||
          (localParsed.layerBatches && localParsed.layerBatches.length > 1)
        );

        if (data) {
          // Parse JSON fields from cloud
          const dataAny = data as any;
          const cloudData: FarmData = {
            farmName: effectiveFarmName,
            monthlyExpenses: (dataAny.monthly_expenses as MonthlyExpense[]) || [],
            eggSales: (dataAny.egg_sales as EggSale[]) || [],
            medicineSchedules: (dataAny.medicine_schedules as MedicineSchedule[]) || defaultMedicineSchedules,
            dealers: (dataAny.dealers as Dealer[]) || [],
            flockInfo: (dataAny.flock_info as FlockInfo) || defaultFlockInfo,
            layerBatches: (dataAny.layer_batches as LayerBatch[]) || undefined,
            activeLayerBatchId: (dataAny.active_layer_batch_id as string) || undefined,
          };

          const isCloudEmpty =
            (!cloudData.monthlyExpenses || cloudData.monthlyExpenses.length === 0) &&
            (!cloudData.eggSales || cloudData.eggSales.length === 0) &&
            (!cloudData.dealers || cloudData.dealers.length === 0) &&
            (!cloudData.flockInfo || (!cloudData.flockInfo.initialCount && (!cloudData.flockInfo.feedPurchases || cloudData.flockInfo.feedPurchases.length === 0)));

          if (isCloudEmpty && hasLocalData && localParsed) {
            // Cloud has blank/empty record while local phone storage contains real farmer data!
            // Preserve and migrate the local data to the cloud account.
            const migrated = migrateData({
              ...localParsed,
              farmName: effectiveFarmName || localParsed.farmName || defaultFarmData.farmName,
            });
            setFarmData(migrated);
            localStorage.setItem('poultryFarmData', JSON.stringify(migrated));
            localStorage.setItem(CUSTOM_FARM_NAME_KEY, effectiveFarmName);
            await saveToCloud(migrated, user.id);
            toast.success('ফোনে সংরক্ষিত ডেটা ক্লাউডে সিঙ্ক করা হয়েছে! ☁️');
          } else {
            const merged = migrateData(cloudData);
            setFarmData(merged);
            localStorage.setItem('poultryFarmData', JSON.stringify(merged));
            localStorage.setItem(CUSTOM_FARM_NAME_KEY, effectiveFarmName);
          }
        } else {
          // No cloud data found for this user in Supabase
          if (hasLocalData && localParsed) {
            // User entered data locally: migrate local data into the newly signed-in cloud account!
            const migrated = migrateData({
              ...localParsed,
              farmName: effectiveFarmName || localParsed.farmName || defaultFarmData.farmName,
            });
            setFarmData(migrated);
            localStorage.setItem('poultryFarmData', JSON.stringify(migrated));
            localStorage.setItem(CUSTOM_FARM_NAME_KEY, effectiveFarmName);
            await saveToCloud(migrated, user.id);
            toast.success('আপনার ডেটা সফলভাবে জিমেইল ক্লাউডে ব্যাকআপ হয়েছে! ☁️');
          } else {
            // Truly fresh user with no existing records anywhere
            const fresh = migrateData({
              ...defaultFarmData,
              farmName: effectiveFarmName,
            });
            setFarmData(fresh);
            localStorage.setItem('poultryFarmData', JSON.stringify(fresh));
            await saveToCloud(fresh, user.id);
          }
        }
      } else {
        // Not logged in (guest mode), use localStorage
        const saved = localStorage.getItem('poultryFarmData');
        const localCustomName = getStoredFarmName();
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as FarmData;
            setFarmData(migrateData({
              ...parsed,
              farmName: (localCustomName && localCustomName !== 'Smart Poultry') ? localCustomName : (parsed.farmName || defaultFarmData.farmName),
            }));
          } catch (e) {
            console.error('Error parsing guest farmData:', e);
          }
        } else if (localCustomName) {
          setFarmData(prev => ({ ...prev, farmName: localCustomName }));
        }
      }
      
      isInitialMount.current = false;
      setIsLoading(false);
    };

    loadData();
  }, [user?.id]);

  // Save to cloud helper
  const saveToCloud = async (data: FarmData, userId: string) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('farm_data')
        .upsert({
          user_id: userId,
          monthly_expenses: data.monthlyExpenses as any,
          egg_sales: data.eggSales as any,
          medicine_schedules: data.medicineSchedules as any,
          dealers: data.dealers as any,
          flock_info: data.flockInfo as any,
          layer_batches: (data.layerBatches || []) as any,
          active_layer_batch_id: data.activeLayerBatchId || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Cloud sync error:', error);
        toast.error('ক্লাউড সিঙ্ক ব্যর্থ হয়েছে');
      }

      // Persist custom farm name in profiles table
      if (data.farmName && data.farmName.trim() && data.farmName.trim() !== 'Smart Poultry') {
        supabase
          .from('profiles')
          .upsert(
            {
              user_id: userId,
              mobile_number: user?.email?.replace('@poultry.app', '') || user?.phone || 'unknown',
              farm_name: data.farmName.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .then(({ error: profileErr }) => {
            if (profileErr) console.error('Cloud farm_name sync error:', profileErr);
          });
      }
    } catch (err) {
      console.error('Cloud sync error:', err);
    }
    setIsSyncing(false);
  };

  // Save to localStorage and cloud when data changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('poultryFarmData', JSON.stringify(farmData));
      if (farmData.farmName && farmData.farmName.trim() && farmData.farmName.trim() !== 'Smart Poultry') {
        localStorage.setItem(CUSTOM_FARM_NAME_KEY, farmData.farmName.trim());
      }
      
      if (user) {
        // Debounce cloud save
        const timeoutId = setTimeout(() => {
          saveToCloud(farmData, user.id);
        }, 1000);

        // Mirror the latest data live to Google Drive
        if (isDriveConnected()) {
          uploadBackup(farmData).catch((err) => {
            console.warn('Google Drive live backup failed:', err?.message || err);
          });
        }
        return () => clearTimeout(timeoutId);
      } else if (isDriveConnected()) {
        const driveTimeout = setTimeout(() => {
          uploadBackup(farmData).catch((err) => {
            console.warn('Google Drive live backup failed:', err?.message || err);
          });
        }, 1200);
        return () => clearTimeout(driveTimeout);
      }
    }
  }, [farmData, user, isLoading]);

  // Check for upcoming medicine reminders and weekly age notifications
  useEffect(() => {
    const checkReminders = () => {
      const today = new Date();
      const notifiedKey = `notified_${format(today, 'yyyy-MM-dd')}`;
      const alreadyNotified = localStorage.getItem(notifiedKey);
      
      if (alreadyNotified) return; // Only notify once per day
      
      let hasNotified = false;
      
      // Medicine reminders
      farmData.medicineSchedules.forEach(schedule => {
        if (schedule.nextDueDate) {
          const dueDate = parseISO(schedule.nextDueDate);
          const daysUntilDue = differenceInDays(dueDate, today);
          
          if (daysUntilDue >= 0 && daysUntilDue <= reminderDays && 'Notification' in window && Notification.permission === 'granted') {
            void showAppNotification(`${schedule.name} রিমাইন্ডার`, {
              body: `${schedule.name} দেওয়ার ${daysUntilDue === 0 ? 'আজই সময়' : `${daysUntilDue} দিন বাকি`}!`,
              icon: '/icons/icon-192.png'
            });
            hasNotified = true;
          }
        }
      });
      
      // Weekly age notification
      if (farmData.flockInfo?.arrivalDate) {
        const arrivalDate = parseISO(farmData.flockInfo.arrivalDate);
        const totalDays = differenceInDays(today, arrivalDate);
        
        // Check if today completes a week (totalDays is multiple of 7)
        if (totalDays > 0 && totalDays % 7 === 0 && 'Notification' in window && Notification.permission === 'granted') {
          const weeks = totalDays / 7;
          void showAppNotification('🐔 সপ্তাহ সম্পূর্ণ!', {
            body: `আজ মুরগির ${weeks} সপ্তাহ পূর্ণ হয়েছে!`,
            icon: '/icons/icon-192.png'
          });
          hasNotified = true;
        }
      }
      
      if (hasNotified) {
        localStorage.setItem(notifiedKey, 'true');
      }
    };

    // Check on mount and every hour
    if (!isLoading) {
      checkReminders();
      const interval = setInterval(checkReminders, 3600000);
      return () => clearInterval(interval);
    }
  }, [farmData.medicineSchedules, farmData.flockInfo, isLoading, reminderDays]);

  // Track data changes for signup prompt
  const markDataChanged = () => {
    if (!user && !hasDataChanged) {
      setHasDataChanged(true);
    }
  };

  const updateReminderDays = (days: number) => {
    setReminderDays(days);
    localStorage.setItem('reminderDays', days.toString());
  };

  const updateFarmName = (name: string) => {
    const trimmed = name.trim() || 'Smart Poultry';
    setFarmData(prev => ({ ...prev, farmName: trimmed }));
    localStorage.setItem(CUSTOM_FARM_NAME_KEY, trimmed);
    markDataChanged();

    if (user) {
      supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            mobile_number: user.email?.replace('@poultry.app', '') || user.phone || 'unknown',
            farm_name: trimmed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Profile farm_name update error:', error);
        });
    }
  };

  // Monthly expense functions
  const addMonthlyExpense = (expense: Omit<MonthlyExpense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setFarmData(prev => syncEggSaleCalculations({
      ...prev,
      monthlyExpenses: [...prev.monthlyExpenses.filter(e => e.month !== expense.month), newExpense]
    }));
    markDataChanged();
  };

  const getMonthlyExpense = (month: string) => {
    return farmData.monthlyExpenses.find(e => e.month === month);
  };

  // Calculate daily fixed expense (without feed)
  const calculateDailyExpense = (month: string): number => {
    return calculateDailyFixedExpense(farmData.monthlyExpenses, month);
  };

  // Calculate daily feed cost
  const calculateDailyFeedCost = (month: string): number => {
    return calculateDailyFeedExpense(farmData.monthlyExpenses, month);
  };

  const getTotalMonthlyExpense = (month: string): number => {
    const expense = getMonthlyExpense(month);
    if (!expense) return 0;
    
    const daysInMonth = new Date(`${month}-01`).getDate() === 1
      ? new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 0).getDate()
      : 0;
    
    // Fixed expense + (daily feed cost * days in month)
    const fixedExpense = expense.electricity + expense.medicine + expense.otherExpenses;
    const dailyFeedCost = (expense.feedBagPrice / 50) * expense.dailyFeedConsumptionKg;
    
    return fixedExpense + (dailyFeedCost * daysInMonth);
  };

  // Egg sales functions - CORRECTED LOGIC (cross-month support)
  const addEggSale = (sale: Omit<EggSale, 'id' | 'totalAmount' | 'accumulatedExpense' | 'profit'>) => {
    const newSale: EggSale = {
      ...sale,
      id: Date.now().toString(),
      totalAmount: 0,
      accumulatedExpense: 0,
      profit: 0,
    };

    setFarmData(prev => syncEggSaleCalculations({
      ...prev,
      eggSales: [...prev.eggSales, newSale]
    }));
    markDataChanged();
  };

  const deleteEggSale = (id: string) => {
    setFarmData(prev => syncEggSaleCalculations({
      ...prev,
      eggSales: prev.eggSales.filter(s => s.id !== id)
    }));
    markDataChanged();
  };

  // Edit egg sale
  const editEggSale = (id: string, sale: Omit<EggSale, 'id' | 'totalAmount' | 'accumulatedExpense' | 'profit'>) => {
    const updatedSale: EggSale = {
      ...sale,
      id,
      totalAmount: 0,
      accumulatedExpense: 0,
      profit: 0,
    };

    setFarmData(prev => syncEggSaleCalculations({
      ...prev,
      eggSales: prev.eggSales.map(existingSale => existingSale.id === id ? updatedSale : existingSale)
    }));
    markDataChanged();
  };

  // Medicine schedule functions
  const setMedicineFirstDate = (id: string, firstDate: string, notes?: string) => {
    setFarmData(prev => {
      const updatedSchedules = prev.medicineSchedules.map(m => {
        if (m.id === id) {
          const nextDueDate = format(addDays(parseISO(firstDate), m.intervalDays), 'yyyy-MM-dd');
          return { 
            ...m, 
            firstDate, 
            lastGivenDate: firstDate,
            nextDueDate,
            completed: false,
            notes: notes || m.notes
          };
        }
        return m;
      });

      // Auto-schedule H5N1 if H9N2 is set (15 days after)
      const updatedSchedule = updatedSchedules.find(m => m.id === id);
      if (updatedSchedule?.name === 'H9N2') {
        const h5n1Index = updatedSchedules.findIndex(m => m.name === 'H5N1');
        if (h5n1Index !== -1) {
          const h5n1Date = format(addDays(parseISO(firstDate), 15), 'yyyy-MM-dd');
          updatedSchedules[h5n1Index] = {
            ...updatedSchedules[h5n1Index],
            firstDate: h5n1Date,
            lastGivenDate: h5n1Date,
            nextDueDate: format(addDays(parseISO(h5n1Date), updatedSchedules[h5n1Index].intervalDays), 'yyyy-MM-dd'),
            completed: false
          };
        }
      }

      return { ...prev, medicineSchedules: updatedSchedules };
    });
    markDataChanged();
  };

  const markMedicineGiven = (id: string, givenDate: string, notes?: string) => {
    setFarmData(prev => {
      const updatedSchedules = prev.medicineSchedules.map(m => {
        if (m.id === id) {
          const nextDueDate = format(addDays(parseISO(givenDate), m.intervalDays), 'yyyy-MM-dd');
          return { 
            ...m, 
            lastGivenDate: givenDate,
            nextDueDate,
            completed: true,
            notes: notes || m.notes
          };
        }
        return m;
      });

      // Auto-schedule H5N1 if H9N2 is marked given (15 days after)
      const updatedSchedule = updatedSchedules.find(m => m.id === id);
      if (updatedSchedule?.name === 'H9N2') {
        const h5n1Index = updatedSchedules.findIndex(m => m.name === 'H5N1');
        if (h5n1Index !== -1) {
          const h5n1Date = format(addDays(parseISO(givenDate), 15), 'yyyy-MM-dd');
          updatedSchedules[h5n1Index] = {
            ...updatedSchedules[h5n1Index],
            lastGivenDate: h5n1Date,
            nextDueDate: format(addDays(parseISO(h5n1Date), updatedSchedules[h5n1Index].intervalDays), 'yyyy-MM-dd'),
            completed: false // Reset to remind for H5N1
          };
        }
      }

      return { ...prev, medicineSchedules: updatedSchedules };
    });
    markDataChanged();
  };

  const updateMedicineNotes = (id: string, notes: string) => {
    setFarmData(prev => ({
      ...prev,
      medicineSchedules: prev.medicineSchedules.map(m => 
        m.id === id ? { ...m, notes } : m
      )
    }));
    markDataChanged();
  };


  const resetMedicineStatus = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      medicineSchedules: prev.medicineSchedules.map(m => 
        m.id === id ? { ...m, completed: false } : m
      )
    }));
  };

  // Dealer functions
  const addDealer = (dealer: Omit<Dealer, 'id' | 'payments'>) => {
    const newDealer = { ...dealer, id: Date.now().toString(), payments: [], openingDue: dealer.openingDue || 0, balanceType: dealer.balanceType || 'due' as const };
    setFarmData(prev => ({
      ...prev,
      dealers: [...prev.dealers, newDealer]
    }));
    markDataChanged();
  };

  const updateDealerOpeningDue = (dealerId: string, openingDue: number) => {
    setFarmData(prev => ({
      ...prev,
      dealers: prev.dealers.map(d => d.id === dealerId ? { ...d, openingDue } : d)
    }));
    markDataChanged();
  };

  const updateDealerBalanceType = (dealerId: string, balanceType: 'due' | 'advance') => {
    setFarmData(prev => ({
      ...prev,
      dealers: prev.dealers.map(d => d.id === dealerId ? { ...d, balanceType } : d)
    }));
    markDataChanged();
  };

  const deleteDealer = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      dealers: prev.dealers.filter(d => d.id !== id)
    }));
    markDataChanged();
  };

  const addDealerPayment = (dealerId: string, payment: Omit<DealerPayment, 'id'>) => {
    const newPayment = { ...payment, id: Date.now().toString() };
    setFarmData(prev => ({
      ...prev,
      dealers: prev.dealers.map(d => 
        d.id === dealerId 
          ? { ...d, payments: [...d.payments, newPayment] }
          : d
      )
    }));
    markDataChanged();
  };

  const editDealerPayment = (dealerId: string, paymentId: string, payment: Omit<DealerPayment, 'id'>) => {
    setFarmData(prev => ({
      ...prev,
      dealers: prev.dealers.map(d => 
        d.id === dealerId 
          ? { 
              ...d, 
              payments: d.payments.map(p => 
                p.id === paymentId ? { ...payment, id: paymentId } : p
              )
            }
          : d
      )
    }));
    markDataChanged();
  };

  const deleteDealerPayment = (dealerId: string, paymentId: string) => {
    setFarmData(prev => ({
      ...prev,
      dealers: prev.dealers.map(d => 
        d.id === dealerId 
          ? { ...d, payments: d.payments.filter(p => p.id !== paymentId) }
          : d
      )
    }));
    markDataChanged();
  };

  // Flock info functions
  const setChickenArrivalDate = (date: string) => {
    setFarmData(prev => syncEggSaleCalculations({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        arrivalDate: date,
      }
    }));
    markDataChanged();
  };

  const setInitialChickenCount = (count: number) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        initialCount: count,
      }
    }));
    markDataChanged();
  };

  const addMortalityRecord = (record: Omit<MortalityRecord, 'id'>) => {
    const newRecord = { ...record, id: Date.now().toString() };
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        mortalityRecords: [...(prev.flockInfo?.mortalityRecords || []), newRecord],
      }
    }));
    markDataChanged();
  };

  const editMortalityRecord = (id: string, record: Omit<MortalityRecord, 'id'>) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        mortalityRecords: (prev.flockInfo?.mortalityRecords || []).map(r =>
          r.id === id ? { ...record, id } : r
        ),
      }
    }));
    markDataChanged();
  };

  const deleteMortalityRecord = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        mortalityRecords: (prev.flockInfo?.mortalityRecords || []).filter(r => r.id !== id),
      }
    }));
    markDataChanged();
  };

  // Feed purchase functions
  const addFeedPurchase = (purchase: Omit<FeedPurchase, 'id' | 'totalAmount'>) => {
    const totalAmount = purchase.bags * purchase.pricePerBag;
    const newPurchase: FeedPurchase = { ...purchase, id: Date.now().toString(), totalAmount };
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        feedPurchases: [...(prev.flockInfo?.feedPurchases || []), newPurchase],
      }
    }));
    markDataChanged();
  };

  const editFeedPurchase = (id: string, purchase: Omit<FeedPurchase, 'id' | 'totalAmount'>) => {
    const totalAmount = purchase.bags * purchase.pricePerBag;
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        feedPurchases: (prev.flockInfo?.feedPurchases || []).map(p =>
          p.id === id ? { ...purchase, id, totalAmount } : p
        ),
      }
    }));
    markDataChanged();
  };

  const deleteFeedPurchase = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        feedPurchases: (prev.flockInfo?.feedPurchases || []).filter(p => p.id !== id),
      }
    }));
    markDataChanged();
  };

  // Egg production functions
  const getLiveChickenCount = useCallback(() => {
    const initial = farmData.flockInfo?.initialCount || 0;
    const totalMortality = (farmData.flockInfo?.mortalityRecords || []).reduce((sum, r) => sum + r.count, 0);
    return initial - totalMortality;
  }, [farmData.flockInfo]);

  const addEggProduction = (production: Omit<EggProduction, 'id' | 'productionRate'>) => {
    const liveCount = getLiveChickenCount();
    const productionRate = liveCount > 0 ? (production.eggsCollected / liveCount) * 100 : 0;
    const newProduction: EggProduction = { ...production, id: Date.now().toString(), productionRate };
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        eggProductions: [...(prev.flockInfo?.eggProductions || []), newProduction],
      }
    }));
    markDataChanged();
  };

  const editEggProduction = (id: string, production: Omit<EggProduction, 'id' | 'productionRate'>) => {
    const liveCount = getLiveChickenCount();
    const productionRate = liveCount > 0 ? (production.eggsCollected / liveCount) * 100 : 0;
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        eggProductions: (prev.flockInfo?.eggProductions || []).map(p =>
          p.id === id ? { ...production, id, productionRate } : p
        ),
      }
    }));
    markDataChanged();
  };

  const deleteEggProduction = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        eggProductions: (prev.flockInfo?.eggProductions || []).filter(p => p.id !== id),
      }
    }));
    markDataChanged();
  };

  // Medicine purchase functions
  const addMedicinePurchase = (purchase: Omit<MedicinePurchase, 'id'>) => {
    const newPurchase: MedicinePurchase = { ...purchase, id: Date.now().toString() };
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        medicinePurchases: [...(prev.flockInfo?.medicinePurchases || []), newPurchase],
      }
    }));
    markDataChanged();
  };

  const editMedicinePurchase = (id: string, purchase: Omit<MedicinePurchase, 'id'>) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        medicinePurchases: (prev.flockInfo?.medicinePurchases || []).map(p =>
          p.id === id ? { ...purchase, id } : p
        ),
      }
    }));
    markDataChanged();
  };

  const deleteMedicinePurchase = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        medicinePurchases: (prev.flockInfo?.medicinePurchases || []).filter(p => p.id !== id),
      }
    }));
    markDataChanged();
  };

  // Misc expense functions
  const addMiscExpense = (expense: Omit<MiscExpense, 'id'>) => {
    const newExpense: MiscExpense = { ...expense, id: Date.now().toString() };
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        miscExpenses: [...(prev.flockInfo?.miscExpenses || []), newExpense],
      }
    }));
    markDataChanged();
  };

  const editMiscExpense = (id: string, expense: Omit<MiscExpense, 'id'>) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        miscExpenses: (prev.flockInfo?.miscExpenses || []).map(e =>
          e.id === id ? { ...expense, id } : e
        ),
      }
    }));
    markDataChanged();
  };

  const deleteMiscExpense = (id: string) => {
    setFarmData(prev => ({
      ...prev,
      flockInfo: {
        ...prev.flockInfo || defaultFlockInfo,
        miscExpenses: (prev.flockInfo?.miscExpenses || []).filter(e => e.id !== id),
      }
    }));
    markDataChanged();
  };

  // Calculated values - now accepts selected month
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const getMonthlyTotals = useCallback((month: string) => {
    const income = farmData.eggSales
      .filter(s => s.date.startsWith(month))
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const expense = farmData.eggSales
      .filter(s => s.date.startsWith(month))
      .reduce((sum, s) => sum + s.accumulatedExpense, 0);

    return { income, expense, netProfit: income - expense };
  }, [farmData.eggSales]);
  
  const monthlyTotals = getMonthlyTotals(selectedMonth);
  const monthlyTotalIncome = monthlyTotals.income;
  const monthlyTotalExpense = monthlyTotals.expense;
  const monthlyNetProfit = monthlyTotals.netProfit;

  const totalDealerPayments = farmData.dealers.reduce(
    (sum, d) => sum + d.payments.reduce((pSum, p) => pSum + p.amount, 0), 
    0
  );

  const getUpcomingMedicines = useCallback(() => {
    const today = new Date();
    return farmData.medicineSchedules
      .filter(m => m.nextDueDate)
      .map(m => ({
        ...m,
        daysUntilDue: differenceInDays(parseISO(m.nextDueDate), today)
      }))
      .filter(m => m.daysUntilDue >= -7) // Show past due up to 7 days
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [farmData.medicineSchedules]);

  // ============ Layer batch management ============
  const layerBatches = farmData.layerBatches || [];
  const activeLayerBatchId = farmData.activeLayerBatchId || layerBatches[0]?.id || '';

  const snapshotOf = (data: FarmData): LayerBatchSnapshot => ({
    monthlyExpenses: data.monthlyExpenses,
    eggSales: data.eggSales,
    medicineSchedules: data.medicineSchedules,
    flockInfo: data.flockInfo || defaultFlockInfo,
  });

  const emptySnapshot = (): LayerBatchSnapshot => ({
    monthlyExpenses: [],
    eggSales: [],
    medicineSchedules: defaultMedicineSchedules.map(m => ({ ...m })),
    flockInfo: { ...defaultFlockInfo, mortalityRecords: [], feedPurchases: [], eggProductions: [], medicinePurchases: [], miscExpenses: [] },
  });

  // Store the currently-live data into its batch and load another snapshot
  const swapTo = (prev: FarmData, targetId: string, batches: LayerBatch[], incoming: LayerBatchSnapshot): FarmData => {
    const currentId = prev.activeLayerBatchId;
    const saved = batches.map(b => b.id === currentId ? { ...b, data: snapshotOf(prev) } : b);
    return syncEggSaleCalculations({
      ...prev,
      ...incoming,
      layerBatches: saved.map(b => b.id === targetId ? { ...b, data: undefined } : b),
      activeLayerBatchId: targetId,
    });
  };

  const switchLayerBatch = (id: string) => {
    setFarmData(prev => {
      if (prev.activeLayerBatchId === id) return prev;
      const batches = prev.layerBatches || [];
      const target = batches.find(b => b.id === id);
      if (!target) return prev;
      return swapTo(prev, id, batches, target.data || emptySnapshot());
    });
    markDataChanged();
  };

  const addLayerBatch = (name: string, supplier?: string) => {
    const newBatch: LayerBatch = {
      id: `batch-${Date.now()}`,
      name: name.trim() || 'নতুন ব্যাচ',
      supplier: supplier?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setFarmData(prev => {
      const batches = [...(prev.layerBatches || []), newBatch];
      return swapTo(prev, newBatch.id, batches, emptySnapshot());
    });
    markDataChanged();
  };

  const renameLayerBatch = (id: string, name: string, supplier?: string) => {
    setFarmData(prev => ({
      ...prev,
      layerBatches: (prev.layerBatches || []).map(b =>
        b.id === id
          ? {
              ...b,
              name: name.trim() || b.name,
              supplier: supplier !== undefined ? (supplier.trim() || undefined) : b.supplier,
            }
          : b
      ),
    }));
    markDataChanged();
  };

  const deleteLayerBatch = (id: string) => {
    setFarmData(prev => {
      const batches = prev.layerBatches || [];
      if (batches.length <= 1) return prev;
      const remaining = batches.filter(b => b.id !== id);
      if (prev.activeLayerBatchId !== id) {
        return { ...prev, layerBatches: remaining };
      }
      // Deleting the active batch: load the first remaining one
      const target = remaining[0];
      return syncEggSaleCalculations({
        ...prev,
        ...(target.data || emptySnapshot()),
        layerBatches: remaining.map(b => b.id === target.id ? { ...b, data: undefined } : b),
        activeLayerBatchId: target.id,
      });
    });
    markDataChanged();
  };

  return {
    farmData,
    isLoading,
    isSyncing,
    isGuest: !user,
    hasDataChanged,
    reminderDays,
    updateReminderDays,
    updateFarmName,
    addMonthlyExpense,
    getMonthlyExpense,
    calculateDailyExpense,
    getTotalMonthlyExpense,
    addEggSale,
    editEggSale,
    deleteEggSale,
    setMedicineFirstDate,
    markMedicineGiven,
    resetMedicineStatus,
    updateMedicineNotes,
    addDealer,
    deleteDealer,
    updateDealerOpeningDue,
    updateDealerBalanceType,
    addDealerPayment,
    editDealerPayment,
    deleteDealerPayment,
    // Flock info functions
    setChickenArrivalDate,
    setInitialChickenCount,
    addMortalityRecord,
    editMortalityRecord,
    deleteMortalityRecord,
    // Feed purchase functions
    addFeedPurchase,
    editFeedPurchase,
    deleteFeedPurchase,
    // Egg production functions
    addEggProduction,
    editEggProduction,
    deleteEggProduction,
    getLiveChickenCount,
    // Medicine purchase functions
    addMedicinePurchase,
    editMedicinePurchase,
    deleteMedicinePurchase,
    // Misc expense functions
    addMiscExpense,
    editMiscExpense,
    deleteMiscExpense,
    // Calculated values
    monthlyTotalIncome,
    monthlyTotalExpense,
    monthlyNetProfit,
    totalDealerPayments,
    getUpcomingMedicines,
    selectedMonth,
    setSelectedMonth,
    // Layer batches
    layerBatches,
    activeLayerBatchId,
    addLayerBatch,
    switchLayerBatch,
    renameLayerBatch,
    deleteLayerBatch,
  };
}
