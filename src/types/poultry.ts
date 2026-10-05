// Multi-poultry system types (Layer stays in src/types/farm.ts)

export type PoultryTypeId = 'layer' | 'cock' | 'sonali' | 'broiler' | 'other';

export const POULTRY_TYPES: { id: PoultryTypeId; label: string; emoji: string }[] = [
  { id: 'layer', label: 'লেয়ার', emoji: '🐔' },
  { id: 'cock', label: 'ককরেল / কক', emoji: '🐓' },
  { id: 'sonali', label: 'সোনালি / মুনালি', emoji: '🐤' },
  { id: 'broiler', label: 'ব্রয়লার', emoji: '🐣' },
  { id: 'other', label: 'অন্যান্য', emoji: '🕊️' },
];

export const COCK_MORTALITY_REASONS = [
  'রোগ',
  'দুর্বল বাচ্চা',
  'দুর্ঘটনা',
  'গরমে চাপ',
  'অজানা',
  'অন্যান্য',
] as const;

export interface CockMortality {
  id: string;
  date: string;
  count: number;
  reason?: string;
  notes?: string;
}

// Feed purchase / stock-in entry
export interface CockFeedEntry {
  id: string;
  date: string;
  feedType?: string;
  bags: number;
  bagSizeKg: number;
  pricePerBag: number;
  totalKg: number;
  totalCost: number;
  notes?: string;
}

// Feed consumed / used entry (reduces stock)
export interface CockFeedConsumption {
  id: string;
  date: string;
  feedType?: string;
  quantityKg: number;
  notes?: string;
}

// Sample weights are stored internally in KG; the UI works in grams.
export interface CockWeightRecord {
  id: string;
  date: string;
  sampleBirds: number;
  totalSampleWeight: number; // kg
  avgWeight: number; // kg
  notes?: string;
}

export interface CockVaccine {
  id: string;
  name: string;
  recommendedAgeDays: number;
  plannedDate: string;
  completedDate?: string;
  status: 'pending' | 'done' | 'skipped';
  notes?: string;
}

export interface CockMedicine {
  id: string;
  date: string;
  problem?: string;
  medicineName: string;
  amount: number;
  notes?: string;
}

export type CockExpenseCategory =
  | 'labour' | 'electricity' | 'litter' | 'gas' | 'transport'
  | 'equipment' | 'repair' | 'vaccine' | 'medicine' | 'other';

export const COCK_EXPENSE_CATEGORIES: { id: CockExpenseCategory; label: string }[] = [
  { id: 'labour', label: 'শ্রমিক' },
  { id: 'electricity', label: 'বিদ্যুৎ' },
  { id: 'litter', label: 'লিটার' },
  { id: 'gas', label: 'গ্যাস' },
  { id: 'transport', label: 'পরিবহন' },
  { id: 'equipment', label: 'সরঞ্জাম' },
  { id: 'repair', label: 'মেরামত' },
  { id: 'vaccine', label: 'ভ্যাকসিন' },
  { id: 'medicine', label: 'ওষুধ' },
  { id: 'other', label: 'অন্যান্য' },
];

export interface CockExpense {
  id: string;
  date: string;
  category: CockExpenseCategory;
  description?: string;
  amount: number;
}

export interface CockSale {
  id: string;
  date: string;
  birds: number;
  totalWeightKg: number;
  pricePerKg: number;
  totalAmount: number;
  buyer?: string;
  notes?: string;
}

export interface CockBatch {
  id: string;
  name: string;
  arrivalDate: string;
  initialCount: number;
  purchaseCost: number;
  supplier?: string;
  breed?: string;
  initialAvgWeight?: number; // kg
  pricePerBird?: number;
  notes?: string;
  // Targets (weights in grams)
  targetSaleAgeDays?: number;
  targetSaleWeightG?: number;
  targetFcr?: number;
  targetMortalityPct?: number;
  mortality: CockMortality[];
  feed: CockFeedEntry[];
  feedConsumption: CockFeedConsumption[];
  weights: CockWeightRecord[];
  vaccines: CockVaccine[];
  medicines: CockMedicine[];
  expenses: CockExpense[];
  sales: CockSale[];
}

// ---------------- Sonali / Munali Types ----------------

export type SonaliBreed = 'sonali' | 'munali' | string;

export interface SonaliMortality {
  id: string;
  date: string;
  count: number;
  reason?: string;
  notes?: string;
}

export interface SonaliFeedEntry {
  id: string;
  date: string;
  feedType?: string;
  bags: number;
  bagSizeKg: number;
  pricePerBag: number;
  totalKg: number;
  totalCost: number;
  notes?: string;
}

export interface SonaliFeedConsumption {
  id: string;
  date: string;
  feedType?: string;
  quantityKg: number;
  notes?: string;
}

export interface SonaliWeightRecord {
  id: string;
  date: string;
  sampleBirds: number;
  totalSampleWeight: number; // in kg internally
  avgWeight: number; // in kg internally
  notes?: string;
}

export interface SonaliVaccine {
  id: string;
  name: string;
  recommendedAgeDays: number;
  plannedDate: string;
  completedDate?: string;
  status: 'pending' | 'done' | 'skipped';
  notes?: string;
}

export interface SonaliMedicine {
  id: string;
  date: string;
  problem?: string;
  medicineName: string;
  amount: number;
  notes?: string;
}

export type SonaliExpenseCategory =
  | 'labour' | 'electricity' | 'litter' | 'gas' | 'transport'
  | 'equipment' | 'repair' | 'vaccine' | 'medicine' | 'other';

export const SONALI_EXPENSE_CATEGORIES: { id: SonaliExpenseCategory; label: string }[] = [
  { id: 'labour', label: 'শ্রমিক' },
  { id: 'electricity', label: 'বিদ্যুৎ' },
  { id: 'litter', label: 'লিটার' },
  { id: 'gas', label: 'গ্যাস' },
  { id: 'transport', label: 'পরিবহন' },
  { id: 'equipment', label: 'সরঞ্জাম' },
  { id: 'repair', label: 'মেরামত' },
  { id: 'vaccine', label: 'ভ্যাকসিন' },
  { id: 'medicine', label: 'ওষুধ' },
  { id: 'other', label: 'অন্যান্য' },
];

export const SONALI_MORTALITY_REASONS = [
  'রোগ',
  'দুর্বল বাচ্চা',
  'দুর্ঘটনা',
  'গরমে চাপ',
  'অন্যান্য',
  'অজানা',
] as const;

export interface SonaliSale {
  id: string;
  date: string;
  birds: number;
  totalWeightKg: number;
  pricePerKg: number;
  totalAmount: number;
  buyer?: string;
  notes?: string;
}

export interface SonaliBatch {
  id: string;
  name: string;
  arrivalDate: string;
  purchaseDate?: string;
  initialCount: number;
  purchaseCost: number;
  supplier?: string;
  breed?: SonaliBreed;
  initialAvgWeight?: number; // kg internally
  pricePerBird?: number;
  notes?: string;
  // Targets (weights in grams)
  targetSaleAgeDays?: number;
  targetSaleWeightG?: number;
  targetFcr?: number;
  targetMortalityPct?: number;
  mortality: SonaliMortality[];
  feed: SonaliFeedEntry[];
  feedConsumption: SonaliFeedConsumption[];
  weights: SonaliWeightRecord[];
  vaccines: SonaliVaccine[];
  medicines: SonaliMedicine[];
  expenses: SonaliExpense[];
  sales: SonaliSale[];
}

export type SonaliExpense = CockExpense;

// ==========================================
// BROILER (ব্রয়লার) DATA MODELS
// ==========================================

export type BroilerBreed = 'ross_308' | 'cobb_500' | 'other';

export const BROILER_BREEDS: { id: BroilerBreed; label: string; enLabel: string }[] = [
  { id: 'ross_308', label: 'রস ৩০৮ (Ross 308)', enLabel: 'Ross 308' },
  { id: 'cobb_500', label: 'কব ৫০০ (Cobb 500)', enLabel: 'Cobb 500' },
  { id: 'other', label: 'অন্যান্য জাত (Other)', enLabel: 'Other' },
];

export const BROILER_MORTALITY_REASONS = [
  'রোগ',
  'দুর্বল বাচ্চা',
  'দুর্ঘটনা',
  'গরমে চাপ',
  'অন্যান্য',
  'অজানা',
] as const;

export type BroilerFeedType = 'starter' | 'grower' | 'finisher' | 'other';

export const BROILER_FEED_TYPES: { id: BroilerFeedType; label: string }[] = [
  { id: 'starter', label: 'ব্রয়লার স্টার্টার (Starter)' },
  { id: 'grower', label: 'ব্রয়লার গ্রোয়ার (Grower)' },
  { id: 'finisher', label: 'ব্রয়লার ফিনিশার (Finisher)' },
  { id: 'other', label: 'অন্যান্য (Other)' },
];

export interface BroilerMortality {
  id: string;
  date: string;
  count: number;
  reason?: string;
  notes?: string;
}

export interface BroilerFeedEntry {
  id: string;
  date: string;
  feedType?: string;
  bags: number;
  bagSizeKg: number;
  pricePerBag: number;
  totalKg: number;
  totalCost: number;
  notes?: string;
}

export interface BroilerFeedConsumption {
  id: string;
  date: string;
  feedType?: string;
  quantityKg: number;
  notes?: string;
}

export interface BroilerWeightRecord {
  id: string;
  date: string;
  sampleBirds: number;
  totalSampleWeight: number; // in kg internally
  avgWeight: number; // in kg internally
  notes?: string;
}

export interface BroilerVaccine {
  id: string;
  name: string;
  recommendedAgeDays: number;
  plannedDate: string;
  completedDate?: string;
  status: 'pending' | 'done' | 'skipped';
  notes?: string;
}

export interface BroilerMedicine {
  id: string;
  date: string;
  problem?: string;
  medicineName: string;
  amount: number;
  notes?: string;
}

export type BroilerExpenseCategory =
  | 'chick' | 'feed' | 'medicine' | 'vaccine' | 'labour' | 'electricity'
  | 'litter' | 'gas' | 'transport' | 'equipment' | 'repair' | 'other';

export const BROILER_EXPENSE_CATEGORIES: { id: BroilerExpenseCategory; label: string }[] = [
  { id: 'chick', label: 'বাচ্চা ক্রয়' },
  { id: 'feed', label: 'খাদ্য' },
  { id: 'medicine', label: 'ওষুধ' },
  { id: 'vaccine', label: 'ভ্যাকসিন' },
  { id: 'labour', label: 'শ্রমিক' },
  { id: 'electricity', label: 'বিদ্যুৎ' },
  { id: 'litter', label: 'লিটার / তুষ' },
  { id: 'gas', label: 'গ্যাস / ব্রুডিং' },
  { id: 'transport', label: 'পরিবহন' },
  { id: 'equipment', label: 'সরঞ্জাম' },
  { id: 'repair', label: 'মেরামত' },
  { id: 'other', label: 'অন্যান্য' },
];

export interface BroilerExpense {
  id: string;
  date: string;
  category: BroilerExpenseCategory;
  description?: string;
  amount: number;
}

export interface BroilerSale {
  id: string;
  date: string;
  birds: number;
  totalWeightKg: number;
  pricePerKg: number;
  totalAmount: number;
  buyer?: string;
  notes?: string;
}

export interface BroilerBatch {
  id: string;
  name: string;
  arrivalDate: string;
  purchaseDate?: string;
  initialCount: number;
  purchaseCost: number;
  supplier?: string;
  breed?: BroilerBreed;
  initialAvgWeight?: number; // kg internally (e.g. 0.040 for 40g DOC)
  pricePerBird?: number;
  notes?: string;
  // Targets (weights in grams)
  targetSaleAgeDays?: number;
  targetSaleWeightG?: number;
  targetFcr?: number;
  targetMortalityPct?: number;
  mortality: BroilerMortality[];
  feed: BroilerFeedEntry[];
  feedConsumption: BroilerFeedConsumption[];
  weights: BroilerWeightRecord[];
  vaccines: BroilerVaccine[];
  medicines: BroilerMedicine[];
  expenses: BroilerExpense[];
  sales: BroilerSale[];
}

export interface PoultrySystem {
  setupComplete: boolean;
  farmName: string;
  farmLocation?: string;
  enabledTypes: PoultryTypeId[];
  disabledTypes: PoultryTypeId[]; // removed but data kept
  activeType: PoultryTypeId;
  cockBatches: CockBatch[];
  activeCockBatchId?: string;
  sonaliBatches: SonaliBatch[];
  activeSonaliBatchId?: string;
  broilerBatches: BroilerBatch[];
  activeBroilerBatchId?: string;
}

export const emptyCockBatch = (partial: Partial<CockBatch>): CockBatch => ({
  id: crypto.randomUUID(),
  name: partial.name || 'Batch C-001',
  arrivalDate: partial.arrivalDate || new Date().toISOString().split('T')[0],
  initialCount: partial.initialCount || 0,
  purchaseCost: partial.purchaseCost || 0,
  supplier: partial.supplier,
  breed: partial.breed,
  initialAvgWeight: partial.initialAvgWeight,
  pricePerBird: partial.pricePerBird,
  notes: partial.notes,
  targetSaleAgeDays: partial.targetSaleAgeDays,
  targetSaleWeightG: partial.targetSaleWeightG,
  targetFcr: partial.targetFcr,
  targetMortalityPct: partial.targetMortalityPct,
  mortality: [],
  feed: [],
  feedConsumption: [],
  weights: [],
  vaccines: [],
  medicines: [],
  expenses: [],
  sales: [],
});

export const emptySonaliBatch = (partial: Partial<SonaliBatch>): SonaliBatch => ({
  id: crypto.randomUUID(),
  name: partial.name || 'Batch S-001',
  arrivalDate: partial.arrivalDate || new Date().toISOString().split('T')[0],
  purchaseDate: partial.purchaseDate || partial.arrivalDate || new Date().toISOString().split('T')[0],
  initialCount: partial.initialCount || 0,
  purchaseCost: partial.purchaseCost || 0,
  supplier: partial.supplier,
  breed: partial.breed || 'সোনালি',
  initialAvgWeight: partial.initialAvgWeight ?? 0.035, // 35g default DOC weight
  pricePerBird: partial.pricePerBird,
  notes: partial.notes,
  targetSaleAgeDays: partial.targetSaleAgeDays ?? 65,
  targetSaleWeightG: partial.targetSaleWeightG ?? 900,
  targetFcr: partial.targetFcr ?? 2.3,
  targetMortalityPct: partial.targetMortalityPct ?? 4.0,
  mortality: [],
  feed: [],
  feedConsumption: [],
  weights: [],
  vaccines: [],
  medicines: [],
  expenses: [],
  sales: [],
});

export const emptyBroilerBatch = (partial: Partial<BroilerBatch>): BroilerBatch => ({
  id: crypto.randomUUID(),
  name: partial.name || 'Batch B-001',
  arrivalDate: partial.arrivalDate || new Date().toISOString().split('T')[0],
  purchaseDate: partial.purchaseDate || partial.arrivalDate || new Date().toISOString().split('T')[0],
  initialCount: partial.initialCount || 0,
  purchaseCost: partial.purchaseCost || 0,
  supplier: partial.supplier,
  breed: partial.breed || 'cobb_500',
  initialAvgWeight: partial.initialAvgWeight ?? 0.040, // 40g default DOC weight
  pricePerBird: partial.pricePerBird,
  notes: partial.notes,
  targetSaleAgeDays: partial.targetSaleAgeDays ?? 35,
  targetSaleWeightG: partial.targetSaleWeightG ?? 2100,
  targetFcr: partial.targetFcr ?? 1.55,
  targetMortalityPct: partial.targetMortalityPct ?? 3.5,
  mortality: [],
  feed: [],
  feedConsumption: [],
  weights: [],
  vaccines: [],
  medicines: [],
  expenses: [],
  sales: [],
});

export const defaultPoultrySystem: PoultrySystem = {
  setupComplete: false,
  farmName: 'Smart Poultry',
  farmLocation: '',
  enabledTypes: [],
  disabledTypes: [],
  activeType: 'layer',
  cockBatches: [],
  sonaliBatches: [],
  broilerBatches: [],
};

