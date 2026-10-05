import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Layers, Skull, Package, Scale, Syringe, Pill, Receipt, Banknote } from 'lucide-react';
import { CockBatch } from '@/types/poultry';
import { CockBatchManager } from './CockBatchManager';
import { CockDashboard } from './CockDashboard';
import { CockMortalityTracker } from './CockMortalityTracker';
import { CockFeedTracker } from './CockFeedTracker';
import { CockWeightTracker } from './CockWeightTracker';
import { CockVaccineManager } from './CockVaccineManager';
import { CockMedicineTracker } from './CockMedicineTracker';
import { CockExpenseTracker } from './CockExpenseTracker';
import { CockSalesTracker } from './CockSalesTracker';

interface Props {
  batches: CockBatch[];
  activeBatch?: CockBatch;
  activeBatchId?: string;
  onAddBatch: (b: CockBatch) => void;
  onSelectBatch: (id: string) => void;
  onDeleteBatch: (id: string) => void;
  onUpdateBatch: (batchId: string, fn: (b: CockBatch) => CockBatch) => void;
}

const trigger = 'flex flex-col items-center gap-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2';

export function CockSection({
  batches, activeBatch, activeBatchId, onAddBatch, onSelectBatch, onDeleteBatch, onUpdateBatch,
}: Props) {
  const [tab, setTab] = useState('dashboard');
  const update = (fn: (b: CockBatch) => CockBatch) => {
    if (activeBatch) onUpdateBatch(activeBatch.id, fn);
  };

  const batchManager = (
    <CockBatchManager
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
            হিসাব শুরু করতে উপরে একটি ব্যাচ যোগ করুন।
          </p>
        </>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-16 bg-secondary">
            <TabsTrigger value="dashboard" className={trigger}><BarChart3 className="w-4 h-4" />ড্যাশবোর্ড</TabsTrigger>
            <TabsTrigger value="mortality" className={trigger}><Skull className="w-4 h-4" />মৃত্যু</TabsTrigger>
            <TabsTrigger value="feed" className={trigger}><Package className="w-4 h-4" />খাদ্য</TabsTrigger>
            <TabsTrigger value="weight" className={trigger}><Scale className="w-4 h-4" />ওজন</TabsTrigger>
            <TabsTrigger value="vaccine" className={trigger}><Syringe className="w-4 h-4" />ভ্যাকসিন</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4 h-16 bg-secondary mt-2">
            <TabsTrigger value="medicine" className={trigger}><Pill className="w-4 h-4" />ওষুধ</TabsTrigger>
            <TabsTrigger value="expense" className={trigger}><Receipt className="w-4 h-4" />খরচ</TabsTrigger>
            <TabsTrigger value="sales" className={trigger}><Banknote className="w-4 h-4" />বিক্রি</TabsTrigger>
            <TabsTrigger value="batches" className={trigger}><Layers className="w-4 h-4" />ব্যাচ</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="dashboard" className="mt-0"><CockDashboard batch={activeBatch} /></TabsContent>
            <TabsContent value="mortality" className="mt-0"><CockMortalityTracker batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="feed" className="mt-0"><CockFeedTracker batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="weight" className="mt-0"><CockWeightTracker batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="vaccine" className="mt-0"><CockVaccineManager batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="medicine" className="mt-0"><CockMedicineTracker batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="expense" className="mt-0"><CockExpenseTracker batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="sales" className="mt-0"><CockSalesTracker batch={activeBatch} onUpdate={update} /></TabsContent>
            <TabsContent value="batches" className="mt-0">{batchManager}</TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
