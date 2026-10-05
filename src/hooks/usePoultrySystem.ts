import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PoultrySystem, defaultPoultrySystem, CockBatch, SonaliBatch, BroilerBatch, PoultryTypeId } from '@/types/poultry';
import { uploadBackup, isDriveConnected } from '@/lib/googleDriveBackup';

const STORAGE_KEY = 'smartPoultrySystem';

const normalize = (raw: any): PoultrySystem => ({
  ...defaultPoultrySystem,
  ...(raw || {}),
  enabledTypes: raw?.enabledTypes?.length ? raw.enabledTypes : defaultPoultrySystem.enabledTypes,
  disabledTypes: raw?.disabledTypes || [],
  cockBatches: (raw?.cockBatches || []).map((b: any) => ({
    mortality: [], feed: [], feedConsumption: [], weights: [], vaccines: [], medicines: [], expenses: [], sales: [],
    ...b,
  })),
  activeCockBatchId: raw?.activeCockBatchId,
  sonaliBatches: (raw?.sonaliBatches || []).map((b: any) => ({
    mortality: [], feed: [], feedConsumption: [], weights: [], vaccines: [], medicines: [], expenses: [], sales: [],
    ...b,
  })),
  activeSonaliBatchId: raw?.activeSonaliBatchId,
  broilerBatches: (raw?.broilerBatches || []).map((b: any) => ({
    mortality: [], feed: [], feedConsumption: [], weights: [], vaccines: [], medicines: [], expenses: [], sales: [],
    ...b,
  })),
  activeBroilerBatchId: raw?.activeBroilerBatchId,
});

const hasMeaningfulFarmData = (raw: any): boolean => {
  if (!raw) return false;
  try {
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const flockCount = Number(d?.flockInfo?.initialCount) || 0;
    const hasSales = Array.isArray(d?.eggSales) && d.eggSales.length > 0;
    const hasExpenses = Array.isArray(d?.monthlyExpenses) && d.monthlyExpenses.length > 0;
    const hasDealers = Array.isArray(d?.dealers) && d.dealers.length > 0;
    const hasBatches = Array.isArray(d?.layerBatches) && d.layerBatches.length > 1;
    return flockCount > 0 || hasSales || hasExpenses || hasDealers || hasBatches;
  } catch {
    return false;
  }
};

export function usePoultrySystem() {
  const { user } = useAuth();
  const [system, setSystem] = useState<PoultrySystem>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalize(JSON.parse(saved));
      const legacy = localStorage.getItem('poultryFarmData');
      if (hasMeaningfulFarmData(legacy)) {
        return {
          ...defaultPoultrySystem,
          setupComplete: true,
          enabledTypes: ['layer'],
          activeType: 'layer',
        };
      }
    } catch {}
    return defaultPoultrySystem;
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem(STORAGE_KEY) && !localStorage.getItem('poultryFarmData');
  });
  const isInitialMount = useRef(true);

  useEffect(() => {
    const load = async () => {
      if (isInitialMount.current && !localStorage.getItem(STORAGE_KEY) && !localStorage.getItem('poultryFarmData')) {
        setIsLoading(true);
      }
      // Always check local storage first so offline setup is never wiped
      const saved = localStorage.getItem(STORAGE_KEY);
      let localSaved: PoultrySystem | null = null;
      if (saved) {
        try {
          localSaved = normalize(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing local smartPoultrySystem:', e);
        }
      }

      if (user) {
        const { data } = await supabase
          .from('farm_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        const raw = (data as any)?.poultry_system;
        if (raw && Object.keys(raw).length > 0 && raw.setupComplete) {
          loaded = normalize(raw);
        } else if (localSaved && localSaved.setupComplete) {
          // Cloud has no setup yet, but local phone storage already has setup completed!
          // Preserve local setup and sync it to the cloud row.
          loaded = localSaved;
          supabase
            .from('farm_data')
            .upsert(
              { user_id: user.id, poultry_system: localSaved as any, updated_at: new Date().toISOString() } as any,
              { onConflict: 'user_id' }
            )
            .then(({ error }) => {
              if (error) console.error('Auto sync local poultry_system to cloud error:', error);
            });
        }
      } else {
        if (localSaved) loaded = localSaved;
      }

      if (!loaded) {
        // If localSaved exists with any info, use it
        if (localSaved) {
          loaded = localSaved;
        } else {
          // Existing Layer users must not be interrupted: if they already have
          // farm data, treat them as a set-up Layer farm.
          const legacy = localStorage.getItem('poultryFarmData');
          if (hasMeaningfulFarmData(legacy)) {
            loaded = {
              ...defaultPoultrySystem,
              setupComplete: true,
              enabledTypes: ['layer'],
              activeType: 'layer',
            };
          }
        }
      }

      const customName = localStorage.getItem('smart_poultry_farm_name');
      if (customName && customName.trim() && customName.trim() !== 'Smart Poultry') {
        loaded = { ...(loaded || defaultPoultrySystem), farmName: customName.trim() };
      }

      setSystem(loaded || defaultPoultrySystem);
      isInitialMount.current = false;
      setIsLoading(false);
    };
    load();
  }, [user?.id]);

  // Persist
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(system));

    if (isDriveConnected()) {
      uploadBackup().catch((err) => {
        console.warn('Google Drive live system sync:', err?.message || err);
      });
    }

    if (user) {
      const t = setTimeout(() => {
        supabase
          .from('farm_data')
          .upsert(
            { user_id: user.id, poultry_system: system as any, updated_at: new Date().toISOString() } as any,
            { onConflict: 'user_id' }
          )
          .then(({ error }) => {
            if (error) console.error('poultry_system sync error', error);
          });
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [system, user, isLoading]);

  const update = useCallback((fn: (s: PoultrySystem) => PoultrySystem) => {
    setSystem((prev) => fn(prev));
  }, []);

  const completeSetup = useCallback(
    (opts: {
      types: PoultryTypeId[];
      farmName: string;
      farmLocation?: string;
      firstBatch?: CockBatch;
      firstSonaliBatch?: SonaliBatch;
      firstBroilerBatch?: BroilerBatch;
    }) => {
      const chosenName = opts.farmName?.trim() || 'Smart Poultry';
      if (chosenName && chosenName !== 'Smart Poultry') {
        localStorage.setItem('smart_poultry_farm_name', chosenName);
      }
      update((s) => ({
        ...s,
        setupComplete: true,
        enabledTypes: opts.types,
        activeType: opts.types[0] || 'layer',
        farmName: chosenName,
        farmLocation: opts.farmLocation,
        cockBatches: opts.firstBatch ? [...s.cockBatches, opts.firstBatch] : s.cockBatches,
        activeCockBatchId: opts.firstBatch ? opts.firstBatch.id : s.activeCockBatchId,
        sonaliBatches: opts.firstSonaliBatch ? [...(s.sonaliBatches || []), opts.firstSonaliBatch] : s.sonaliBatches || [],
        activeSonaliBatchId: opts.firstSonaliBatch ? opts.firstSonaliBatch.id : s.activeSonaliBatchId,
        broilerBatches: opts.firstBroilerBatch ? [...(s.broilerBatches || []), opts.firstBroilerBatch] : s.broilerBatches || [],
        activeBroilerBatchId: opts.firstBroilerBatch ? opts.firstBroilerBatch.id : s.activeBroilerBatchId,
      }));
    },
    [update]
  );

  const updateFarmName = useCallback(
    (name: string) => {
      const trimmed = name?.trim() || 'Smart Poultry';
      if (trimmed && trimmed !== 'Smart Poultry') {
        localStorage.setItem('smart_poultry_farm_name', trimmed);
      }
      update((s) => ({ ...s, farmName: trimmed }));
    },
    [update]
  );

  const setActiveType = useCallback(
    (type: PoultryTypeId) => update((s) => ({ ...s, activeType: type })),
    [update]
  );

  const addPoultryType = useCallback(
    (type: PoultryTypeId) =>
      update((s) => ({
        ...s,
        enabledTypes: s.enabledTypes.includes(type) ? s.enabledTypes : [...s.enabledTypes, type],
        disabledTypes: s.disabledTypes.filter((t) => t !== type),
      })),
    [update]
  );

  const removePoultryType = useCallback(
    (type: PoultryTypeId) =>
      update((s) => {
        const enabled = s.enabledTypes.filter((t) => t !== type);
        return {
          ...s,
          enabledTypes: enabled,
          disabledTypes: s.disabledTypes.includes(type) ? s.disabledTypes : [...s.disabledTypes, type],
          activeType: s.activeType === type ? enabled[0] || 'layer' : s.activeType,
        };
      }),
    [update]
  );

  // ---- Cock batches ----
  const addCockBatch = useCallback(
    (batch: CockBatch) =>
      update((s) => ({ ...s, cockBatches: [...s.cockBatches, batch], activeCockBatchId: batch.id })),
    [update]
  );

  const updateCockBatch = useCallback(
    (batchId: string, fn: (b: CockBatch) => CockBatch) =>
      update((s) => ({
        ...s,
        cockBatches: s.cockBatches.map((b) => (b.id === batchId ? fn(b) : b)),
      })),
    [update]
  );

  const deleteCockBatch = useCallback(
    (batchId: string) =>
      update((s) => {
        const rest = s.cockBatches.filter((b) => b.id !== batchId);
        return {
          ...s,
          cockBatches: rest,
          activeCockBatchId: s.activeCockBatchId === batchId ? rest[0]?.id : s.activeCockBatchId,
        };
      }),
    [update]
  );

  const setActiveCockBatch = useCallback(
    (batchId: string) => update((s) => ({ ...s, activeCockBatchId: batchId })),
    [update]
  );

  const activeCockBatch =
    system.cockBatches.find((b) => b.id === system.activeCockBatchId) || system.cockBatches[0];

  // ---- Sonali batches ----
  const addSonaliBatch = useCallback(
    (batch: SonaliBatch) =>
      update((s) => ({
        ...s,
        sonaliBatches: [...(s.sonaliBatches || []), batch],
        activeSonaliBatchId: batch.id,
      })),
    [update]
  );

  const updateSonaliBatch = useCallback(
    (batchId: string, fn: (b: SonaliBatch) => SonaliBatch) =>
      update((s) => ({
        ...s,
        sonaliBatches: (s.sonaliBatches || []).map((b) => (b.id === batchId ? fn(b) : b)),
      })),
    [update]
  );

  const deleteSonaliBatch = useCallback(
    (batchId: string) =>
      update((s) => {
        const rest = (s.sonaliBatches || []).filter((b) => b.id !== batchId);
        return {
          ...s,
          sonaliBatches: rest,
          activeSonaliBatchId: s.activeSonaliBatchId === batchId ? rest[0]?.id : s.activeSonaliBatchId,
        };
      }),
    [update]
  );

  const setActiveSonaliBatch = useCallback(
    (batchId: string) => update((s) => ({ ...s, activeSonaliBatchId: batchId })),
    [update]
  );

  const activeSonaliBatch =
    (system.sonaliBatches || []).find((b) => b.id === system.activeSonaliBatchId) || (system.sonaliBatches || [])[0];

  // ---- Broiler batches ----
  const addBroilerBatch = useCallback(
    (batch: BroilerBatch) =>
      update((s) => ({
        ...s,
        broilerBatches: [...(s.broilerBatches || []), batch],
        activeBroilerBatchId: batch.id,
      })),
    [update]
  );

  const updateBroilerBatch = useCallback(
    (batchId: string, fn: (b: BroilerBatch) => BroilerBatch) =>
      update((s) => ({
        ...s,
        broilerBatches: (s.broilerBatches || []).map((b) => (b.id === batchId ? fn(b) : b)),
      })),
    [update]
  );

  const deleteBroilerBatch = useCallback(
    (batchId: string) =>
      update((s) => {
        const rest = (s.broilerBatches || []).filter((b) => b.id !== batchId);
        return {
          ...s,
          broilerBatches: rest,
          activeBroilerBatchId: s.activeBroilerBatchId === batchId ? rest[0]?.id : s.activeBroilerBatchId,
        };
      }),
    [update]
  );

  const setActiveBroilerBatch = useCallback(
    (batchId: string) => update((s) => ({ ...s, activeBroilerBatchId: batchId })),
    [update]
  );

  const activeBroilerBatch =
    (system.broilerBatches || []).find((b) => b.id === system.activeBroilerBatchId) || (system.broilerBatches || [])[0];

  const restartSetup = useCallback(() => {
    update((s) => ({ ...s, setupComplete: false }));
  }, [update]);

  return {
    system,
    isLoading,
    completeSetup,
    restartSetup,
    setActiveType,
    addPoultryType,
    removePoultryType,
    addCockBatch,
    updateCockBatch,
    deleteCockBatch,
    setActiveCockBatch,
    activeCockBatch,
    addSonaliBatch,
    updateSonaliBatch,
    deleteSonaliBatch,
    setActiveSonaliBatch,
    activeSonaliBatch,
    addBroilerBatch,
    updateBroilerBatch,
    deleteBroilerBatch,
    setActiveBroilerBatch,
    activeBroilerBatch,
    updateFarmName,
  };
}

