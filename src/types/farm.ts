// Monthly expense structure
export interface MonthlyExpense {
  id: string;
  month: string; // Format: YYYY-MM
  electricity: number;
  medicine: number;
  feedBagPrice: number; // Price of one 50kg bag
  dailyFeedConsumptionKg: number; // Daily feed consumption in kg
  otherExpenses: number;
}

// Egg sale entry
export interface EggSale {
  id: string;
  date: string;
  eggsOrCrates: number;
  unit: 'eggs' | 'crates'; // 1 crate = 30 eggs
  ratePerUnit: number;
  totalAmount: number;
  accumulatedExpense: number;
  profit: number;
  notes?: string;
}

// Medicine/Vaccine schedule
export interface MedicineSchedule {
  id: string;
  name: string;
  type: 'LASOTA' | 'KIMI' | 'VACCINE';
  intervalDays: number; // 30, 45, or 90
  firstDate: string;
  lastGivenDate: string;
  nextDueDate: string;
  completed: boolean;
  notes?: string; // Notes for which medicine was given
}

// Dealer payment
export interface DealerPayment {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

// Dealer info
export interface Dealer {
  id: string;
  name: string;
  phone?: string;
  openingDue?: number; // Initial outstanding balance (বকেয়া)
  balanceType?: 'due' | 'advance'; // Default label: বকেয়া or অগ্রিম
  payments: DealerPayment[];
}

// Mortality record
export interface MortalityRecord {
  id: string;
  date: string;
  count: number;
  notes?: string;
}

// Feed purchase record
export interface FeedPurchase {
  id: string;
  date: string;
  bags: number;
  pricePerBag: number;
  totalAmount: number;
  dealerId?: string; // Optional dealer this feed was bought from (adds to their বকেয়া)
  notes?: string;
}

// Medicine purchase record
export interface MedicinePurchase {
  id: string;
  date: string;
  amount: number;
  problem?: string; // What problem this medicine is for
  notes?: string;
}

// Miscellaneous expense record
export interface MiscExpense {
  id: string;
  date: string;
  amount: number;
  description: string;
  notes?: string;
}

// Egg production record
export interface EggProduction {
  id: string;
  date: string;
  eggsCollected: number;
  productionRate: number; // percentage
  notes?: string;
}

// Flock info (chicken age & mortality tracking)
export interface FlockInfo {
  arrivalDate: string; // Date chickens arrived
  initialCount: number; // Starting chicken count
  mortalityRecords: MortalityRecord[];
  feedPurchases: FeedPurchase[];
  eggProductions: EggProduction[];
  medicinePurchases: MedicinePurchase[];
  miscExpenses: MiscExpense[];
}

// Per-batch stored data (only for non-active batches; the active batch's
// data always lives in the top-level FarmData fields)
export interface LayerBatchSnapshot {
  monthlyExpenses: MonthlyExpense[];
  eggSales: EggSale[];
  medicineSchedules: MedicineSchedule[];
  flockInfo: FlockInfo;
}

export interface LayerBatch {
  id: string;
  name: string;
  supplier?: string;
  createdAt: string;
  data?: LayerBatchSnapshot; // undefined when this batch is the active one
}

// Complete farm data structure
export interface FarmData {
  farmName: string;
  monthlyExpenses: MonthlyExpense[];
  eggSales: EggSale[];
  medicineSchedules: MedicineSchedule[];
  dealers: Dealer[];
  flockInfo?: FlockInfo; // Optional for backward compatibility
  layerBatches?: LayerBatch[];
  activeLayerBatchId?: string;
}
