import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Layers,
  Skull,
  Package,
  Scale,
  Syringe,
  Pill,
  Receipt,
  Banknote,
  FileText,
} from 'lucide-react';
import { BroilerBatch } from '@/types/poultry';
import { BroilerBatchManager } from './BroilerBatchManager';
import { BroilerDashboard } from './BroilerDashboard';
import { BroilerMortalityTracker } from './BroilerMortalityTracker';
import { BroilerFeedTracker } from './BroilerFeedTracker';
import { BroilerWeightTracker } from './BroilerWeightTracker';
import { BroilerVaccineManager } from './BroilerVaccineManager';
import { BroilerMedicineTracker } from './BroilerMedicineTracker';
import { BroilerExpenseTracker } from './BroilerExpenseTracker';
import { BroilerSalesTracker } from './BroilerSalesTracker';
import { BroilerReport } from './BroilerReport';

interface Props {
  batches: BroilerBatch[];
  activeBatch?: BroilerBatch;
  activeBatchId?: string;
  onAddBatch: (b: BroilerBatch) => void;
  onSelectBatch: (id: string) => void;
  onDeleteBatch: (id: string) => void;
  onUpdateBatch: (batchId: string, fn: (b: BroilerBatch) => BroilerBatch) => void;
}

const trigger =
  'flex flex-col items-center gap-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2';

export function BroilerSection({
  batches,
  activeBatch,
  activeBatchId,
  onAddBatch,
  onSelectBatch,
  onDeleteBatch,
  onUpdateBatch,
}: Props) {
  const [tab, setTab] = useState('dashboard');

  const update = (fn: (b: BroilerBatch) => BroilerBatch) => {
    if (activeBatch) onUpdateBatch(activeBatch.id, fn);
  };

  const batchManager = (
    <BroilerBatchManager
      batches={batches}
      activeBatchId={activeBatch?.id ?? activeBatchId}
      onAdd={onAddBatch}
      onSelect={onSelectBatch}
      onDelete={onDeleteBatch}
      onUpdate={onUpdateBatch}
    />
  );

  return (
    <div className="space-y-4">
      {!activeBatch ? (
        <>
          {batchManager}
          <p className="text-sm text-muted-foreground text-center py-6">
            ব্রয়লার হিসাব শুরু করতে উপরে একটি নতুন ব্যাচ তৈরি করুন।
          </p>
        </>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-16 bg-secondary">
            <TabsTrigger value="dashboard" className={trigger}>
              <BarChart3 className="w-4 h-4" />
              ড্যাশবোর্ড
            </TabsTrigger>
            <TabsTrigger value="mortality" className={trigger}>
              <Skull className="w-4 h-4" />
              মৃত্যু
            </TabsTrigger>
            <TabsTrigger value="feed" className={trigger}>
              <Package className="w-4 h-4" />
              খাদ্য
            </TabsTrigger>
            <TabsTrigger value="weight" className={trigger}>
              <Scale className="w-4 h-4" />
              ওজন (গ্রাম)
            </TabsTrigger>
            <TabsTrigger value="vaccine" className={trigger}>
              <Syringe className="w-4 h-4" />
              ভ্যাকসিন
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-5 h-16 bg-secondary mt-2">
            <TabsTrigger value="medicine" className={trigger}>
              <Pill className="w-4 h-4" />
              ওষুধ
            </TabsTrigger>
            <TabsTrigger value="expense" className={trigger}>
              <Receipt className="w-4 h-4" />
              খরচ
            </TabsTrigger>
            <TabsTrigger value="sales" className={trigger}>
              <Banknote className="w-4 h-4" />
              বিক্রি
            </TabsTrigger>
            <TabsTrigger value="batches" className={trigger}>
              <Layers className="w-4 h-4" />
              ব্যাচ
            </TabsTrigger>
            <TabsTrigger value="report" className={trigger}>
              <FileText className="w-4 h-4" />
              রিপোর্ট
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="dashboard" className="mt-0">
              <BroilerDashboard batch={activeBatch} />
            </TabsContent>
            <TabsContent value="mortality" className="mt-0">
              <BroilerMortalityTracker batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="feed" className="mt-0">
              <BroilerFeedTracker batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="weight" className="mt-0">
              <BroilerWeightTracker batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="vaccine" className="mt-0">
              <BroilerVaccineManager batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="medicine" className="mt-0">
              <BroilerMedicineTracker batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="expense" className="mt-0">
              <BroilerExpenseTracker batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="sales" className="mt-0">
              <BroilerSalesTracker batch={activeBatch} onUpdate={update} />
            </TabsContent>
            <TabsContent value="batches" className="mt-0">
              {batchManager}
            </TabsContent>
            <TabsContent value="report" className="mt-0">
              <BroilerReport batch={activeBatch} />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
