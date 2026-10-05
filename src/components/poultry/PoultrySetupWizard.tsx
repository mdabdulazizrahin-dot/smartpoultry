import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { POULTRY_TYPES, PoultryTypeId, CockBatch, emptyCockBatch, SonaliBatch, emptySonaliBatch, BroilerBatch, emptyBroilerBatch } from '@/types/poultry';
import { HatcherySupplierSelect } from './HatcherySupplierSelect';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  onComplete: (opts: {
    types: PoultryTypeId[];
    farmName: string;
    farmLocation?: string;
    firstBatch?: CockBatch;
    firstSonaliBatch?: SonaliBatch;
    firstBroilerBatch?: BroilerBatch;
  }) => void;
  defaultFarmName?: string;
  onCancel?: () => void;
}

const toBn = (v: string | number) =>
  String(v).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export function PoultrySetupWizard({ onComplete, defaultFarmName = 'Smart Poultry', onCancel }: Props) {
  const { language, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<PoultryTypeId | null>(null);
  const [farmName, setFarmName] = useState(defaultFarmName);
  const [farmLocation, setFarmLocation] = useState('');
  const [batchName, setBatchName] = useState('Batch C-001');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialCount, setInitialCount] = useState('');
  const [pricePerBird, setPricePerBird] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [supplier, setSupplier] = useState('');

  const needsBatch = selectedType === 'cock' || selectedType === 'sonali' || selectedType === 'broiler';

  const count = parseInt(initialCount) || 0;
  const perBird = parseFloat(pricePerBird) || 0;
  const totalCost = parseFloat(purchaseCost) || 0;

  // Auto calculate total cost when count or rate changes
  const handleCountChange = (val: string) => {
    setInitialCount(val);
    const cnt = parseFloat(val) || 0;
    const rate = parseFloat(pricePerBird) || 0;
    if (cnt > 0 && rate > 0) {
      setPurchaseCost(String(Math.round(cnt * rate)));
    }
  };

  const handlePricePerBirdChange = (val: string) => {
    setPricePerBird(val);
    const rate = parseFloat(val) || 0;
    const cnt = parseFloat(initialCount) || 0;
    if (cnt > 0 && rate > 0) {
      setPurchaseCost(String(Math.round(cnt * rate)));
    }
  };

  const handlePurchaseCostChange = (val: string) => {
    setPurchaseCost(val);
    const cost = parseFloat(val) || 0;
    const cnt = parseFloat(initialCount) || 0;
    if (cnt > 0 && cost > 0 && !pricePerBird) {
      const calculatedRate = (cost / cnt).toFixed(2).replace(/\.00$/, '');
      setPricePerBird(calculatedRate);
    }
  };

  const finish = () => {
    if (!selectedType) return;
    const finalCount = count;
    const finalRate = perBird || (finalCount > 0 && totalCost > 0 ? totalCost / finalCount : undefined);
    const finalCost = totalCost || (finalCount > 0 && finalRate ? Math.round(finalCount * finalRate) : 0);

    const firstCockBatch = selectedType === 'cock'
      ? emptyCockBatch({
          name: batchName || 'Batch C-001',
          arrivalDate,
          initialCount: finalCount,
          pricePerBird: finalRate,
          purchaseCost: finalCost,
          supplier,
        })
      : undefined;

    const firstSonaliBatch = selectedType === 'sonali'
      ? emptySonaliBatch({
          name: batchName || 'Batch S-001',
          arrivalDate,
          initialCount: finalCount,
          pricePerBird: finalRate,
          purchaseCost: finalCost,
          breed: 'সোনালি',
          supplier,
        })
      : undefined;

    const firstBroilerBatch = selectedType === 'broiler'
      ? emptyBroilerBatch({
          name: batchName || 'Batch B-001',
          arrivalDate,
          initialCount: finalCount,
          pricePerBird: finalRate,
          purchaseCost: finalCost,
          breed: 'cobb_500',
          supplier,
        })
      : undefined;

    onComplete({
      types: [selectedType],
      farmName: farmName.trim() || 'Smart Poultry',
      farmLocation,
      firstBatch: firstCockBatch,
      firstSonaliBatch,
      firstBroilerBatch,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🐔</div>
          <h1 className="text-2xl font-bold">{t('welcomeToApp')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('setupFarmSteps')}
          </p>
        </div>

        <Card className="border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold">
              {step === 1 && t('whichPoultryType')}
              {step === 2 && t('farmInfo')}
              {step === 3 && (
                selectedType === 'sonali'
                  ? `${t('firstBatchTitle')} (${language === 'bn' ? 'সোনালি / মুনালি' : 'Sonali / Munali'})`
                  : selectedType === 'broiler'
                  ? `${t('firstBatchTitle')} (${language === 'bn' ? 'ব্রয়লার' : 'Broiler'})`
                  : `${t('firstBatchTitle')} (${language === 'bn' ? 'কক' : 'Cock'})`
              )}
            </CardTitle>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <RadioGroup
                  value={selectedType ?? ''}
                  onValueChange={(value) => {
                    const tVal = value as PoultryTypeId;
                    setSelectedType(tVal);
                    if (tVal === 'sonali') setBatchName('Batch S-001');
                    else if (tVal === 'cock') setBatchName('Batch C-001');
                    else if (tVal === 'broiler') setBatchName('Batch B-001');
                  }}
                  className="space-y-2"
                >
                  {POULTRY_TYPES.map((tItem) => (
                    <label
                      key={tItem.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedType === tItem.id
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border hover:bg-secondary'
                      )}
                    >
                      <RadioGroupItem value={tItem.id} id={`type-${tItem.id}`} />
                      <span className="text-xl">{tItem.emoji}</span>
                      <span className="font-medium flex-1">{tItem.label}</span>
                    </label>
                  ))}
                </RadioGroup>
                <Button
                  className="w-full font-semibold"
                  onClick={() => (selectedType ? setStep(2) : toast.error(language === 'bn' ? 'অন্তত একটি ধরন নির্বাচন করুন' : 'Please select at least one poultry type'))}
                >
                  {t('continueBtn')}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>{t('farmName')}</Label>
                  <Input value={farmName} onChange={(e) => setFarmName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('farmLocationOpt')}</Label>
                  <Input value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    {t('backBtn')}
                  </Button>
                  <Button className="flex-1 font-semibold" onClick={() => (needsBatch ? setStep(3) : finish())}>
                    {needsBatch ? t('continueBtn') : t('startBtn')}
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>{t('batchName')}</Label>
                  <Input value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>{t('arrivalDate')}</Label>
                  <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>{t('initialBirdCount')}</Label>
                  <Input
                    type="number"
                    value={initialCount}
                    onChange={(e) => handleCountChange(e.target.value)}
                    placeholder="১২০০"
                  />
                </div>

                {/* প্রতি বাচ্চার দাম (৳) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="price-per-bird">{t('pricePerChick')}</Label>
                    {count > 0 && perBird > 0 && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {language === 'bn' ? 'দর নির্ধারিত' : 'Rate set'}
                      </span>
                    )}
                  </div>
                  <Input
                    id="price-per-bird"
                    type="number"
                    step="0.01"
                    value={pricePerBird}
                    onChange={(e) => handlePricePerBirdChange(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: ৩৫' : 'e.g. 35'}
                  />
                </div>

                {/* মোট ক্রয় মূল্য (৳) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="purchase-cost">{t('totalPurchaseCost')}</Label>
                    {count > 0 && perBird > 0 && (
                      <span className="text-[11px] text-muted-foreground font-normal">
                        {t('autoCalculated')}
                      </span>
                    )}
                  </div>
                  <Input
                    id="purchase-cost"
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => handlePurchaseCostChange(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: ৪২০০০' : 'e.g. 42000'}
                  />

                  {/* লাইভ ক্যালকুলেশন প্রিভিউ */}
                  {count > 0 && perBird > 0 && (
                    <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-lg flex items-center justify-between mt-1.5 shadow-2xs">
                      <span>💡 {language === 'bn' ? 'মোট ক্রয় হিসাব:' : 'Total Cost:'}</span>
                      <span className="font-semibold font-number">
                        {language === 'bn'
                          ? `${toBn(count)} টি × ${toBn(perBird)} ৳ = ${toBn((count * perBird).toLocaleString('bn-BD'))} ৳`
                          : `${count.toLocaleString('en-US')} chicks × ${perBird} ৳ = ${(count * perBird).toLocaleString('en-US')} ৳`}
                      </span>
                    </div>
                  )}
                </div>

                <HatcherySupplierSelect
                  value={supplier}
                  onChange={setSupplier}
                  label={t('selectHatcheryOpt')}
                />

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    {t('backBtn')}
                  </Button>
                  <Button className="flex-1 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={finish}>
                    {t('startBtn')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
