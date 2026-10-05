import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Egg, Syringe, Store, FileText, Cloud, Loader2, Bird, Skull, LogIn, Package, TrendingUp, BarChart3, Pill, Receipt, Layers, ShieldCheck, Sparkles, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { FinancialSummary } from '@/components/FinancialSummary';
import { MonthlyExpenseForm } from '@/components/MonthlyExpenseForm';
import { EggSalesTracker } from '@/components/EggSalesTracker';
import { MedicineScheduler } from '@/components/MedicineScheduler';
import { DealerTracker } from '@/components/DealerTracker';
import { ReportGenerator } from '@/components/ReportGenerator';
import { ReminderSettings } from '@/components/ReminderSettings';
import { ProfileMenu } from '@/components/ProfileMenu';
import { ChickenAgeTracker } from '@/components/ChickenAgeTracker';
import { MortalityTracker } from '@/components/MortalityTracker';
import { SignupPrompt } from '@/components/SignupPrompt';
import { FeedTracker } from '@/components/FeedTracker';
import { VaccineRecommendation } from '@/components/VaccineRecommendation';
import { EggProductionTracker } from '@/components/EggProductionTracker';
import { DashboardCharts } from '@/components/DashboardCharts';
import { MedicineExpenseTracker } from '@/components/MedicineExpenseTracker';
import { MiscExpenseTracker } from '@/components/MiscExpenseTracker';
import { PDFReportGenerator } from '@/components/PDFReportGenerator';
import { DataExport } from '@/components/DataExport';
import { useFarmData } from '@/hooks/useFarmData';
import { usePoultrySystem } from '@/hooks/usePoultrySystem';
import { PoultrySetupWizard } from '@/components/poultry/PoultrySetupWizard';
import { LayerBatchManager } from '@/components/LayerBatchManager';

import { MyPoultrySettings } from '@/components/poultry/MyPoultrySettings';
import { CockSection } from '@/components/cock/CockSection';
import { SonaliSection } from '@/components/sonali/SonaliSection';
import { BroilerSection } from '@/components/broiler/BroilerSection';
import { POULTRY_TYPES } from '@/types/poultry';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PoultryBazarHeader } from '@/components/PoultryBazarHeader';
import { ProfileView } from '@/components/ProfileView';
import { SideDrawer } from '@/components/SideDrawer';
import { AIAssistantModal } from '@/components/AIAssistantModal';
import { ApkDownloadBanner } from '@/components/ApkDownloadBanner';
import { useProfile } from '@/hooks/useProfile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showPoultrySettings, setShowPoultrySettings] = useState(false);
  const [showSetupWizardModal, setShowSetupWizardModal] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { avatarUrl } = useProfile();

  const {
    system,
    isLoading: poultryLoading,
    completeSetup,
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
    updateFarmName: updateSystemFarmName,
  } = usePoultrySystem();
  
  const {
    farmData,
    isLoading,
    isSyncing,
    isGuest,
    hasDataChanged,
    reminderDays,
    updateReminderDays,
    updateFarmName,
    addMonthlyExpense,
    getMonthlyExpense,
    calculateDailyExpense,
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
    // Flock info
    setChickenArrivalDate,
    setInitialChickenCount,
    addMortalityRecord,
    editMortalityRecord,
    deleteMortalityRecord,
    // Feed purchases
    addFeedPurchase,
    editFeedPurchase,
    deleteFeedPurchase,
    // Egg production
    addEggProduction,
    editEggProduction,
    deleteEggProduction,
    getLiveChickenCount,
    // Medicine purchases
    addMedicinePurchase,
    editMedicinePurchase,
    deleteMedicinePurchase,
    // Misc expenses
    addMiscExpense,
    editMiscExpense,
    deleteMiscExpense,
    // Calculated values
    monthlyTotalIncome,
    monthlyTotalExpense,
    monthlyNetProfit,
    totalDealerPayments,
    selectedMonth,
    setSelectedMonth,
    // Layer batches
    layerBatches,
    activeLayerBatchId,
    addLayerBatch,
    switchLayerBatch,
    renameLayerBatch,
    deleteLayerBatch,
  } = useFarmData();

  // Show signup prompt after first data change in guest mode
  useEffect(() => {
    if (isGuest && hasDataChanged) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowSignupPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isGuest, hasDataChanged]);

  const currentExpense = getMonthlyExpense(selectedMonth);
  const dailyExpense = calculateDailyExpense(selectedMonth);

  const handleUpdateFarmName = (name: string) => {
    updateFarmName(name);
    updateSystemFarmName(name);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowProfileView(false);
      setShowSideDrawer(false);
      toast.success('সফলভাবে লগআউট হয়েছে');
    } catch (e) {
      console.error('Logout error:', e);
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  if (!system.setupComplete && (isLoading || poultryLoading)) {
    return null;
  }

  if (!system.setupComplete || showSetupWizardModal) {
    return (
      <PoultrySetupWizard
        defaultFarmName={farmData.farmName}
        onCancel={system.setupComplete ? () => setShowSetupWizardModal(false) : undefined}
        onComplete={(opts) => {
          completeSetup(opts);
          if (opts.farmName) {
            handleUpdateFarmName(opts.farmName);
          }
          setShowSetupWizardModal(false);
        }}
      />
    );
  }

  if (showProfileView) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileView
          onBack={() => setShowProfileView(false)}
          onOpenMenu={() => setShowSideDrawer(true)}
          userMobile={user?.email}
          isLoggedIn={!!user}
          onSignOut={handleSignOut}
          onSignIn={() => navigate('/auth')}
          avatarUrl={avatarUrl}
        />
        <SideDrawer
          open={showSideDrawer}
          onOpenChange={setShowSideDrawer}
          onOpenProfile={() => setShowProfileView(true)}
          onOpenPoultrySettings={() => setShowPoultrySettings(true)}
          onOpenSetupWizard={() => {
            setShowProfileView(false);
            setShowSetupWizardModal(true);
          }}
          onOpenDriveBackup={() => toast.info('Google Drive ব্যাকআপ অপশন সক্রিয় রয়েছে')}
          onOpenAiAssistant={() => setShowAiAssistant(true)}
          enabledTypes={system.enabledTypes.length ? system.enabledTypes : ['layer']}
          activeType={system.activeType}
          onSelectType={setActiveType}
          isLoggedIn={!!user}
          onSignOut={handleSignOut}
          onSignIn={() => navigate('/auth')}
          userMobile={user?.email}
        />
        <AIAssistantModal
          open={showAiAssistant}
          onOpenChange={setShowAiAssistant}
          initialMode="general"
        />
      </div>
    );
  }

  const isLayer = system.activeType === 'layer';

  const hasAnyFarmData = 
    Boolean(farmData.flockInfo?.initialCount && farmData.flockInfo.initialCount > 0) ||
    Boolean(farmData.monthlyExpenses && farmData.monthlyExpenses.length > 0) ||
    Boolean(farmData.eggSales && farmData.eggSales.length > 0) ||
    Boolean(system.cockBatches && system.cockBatches.length > 0) ||
    Boolean((system.sonaliBatches || []).length > 0) ||
    Boolean((system.broilerBatches || []).length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Poultry BAZAR Header */}
        <div className="-mx-4 -mt-4 mb-2">
          <PoultryBazarHeader
            onOpenMenu={() => setShowSideDrawer(true)}
            onOpenProfile={() => setShowProfileView(true)}
            avatarUrl={avatarUrl}
            isLoggedIn={!!user}
          />
        </div>

        {/* Android APK Download Notice Banner for Web Users */}
        <ApkDownloadBanner />

        {/* Header */}
        <DashboardHeader 
          farmName={farmData.farmName} 
          onUpdateName={handleUpdateFarmName} 
        />

        {!isLayer && (
          system.activeType === 'cock' ? (
            <CockSection
              batches={system.cockBatches}
              activeBatch={activeCockBatch}
              activeBatchId={system.activeCockBatchId}
              onAddBatch={addCockBatch}
              onSelectBatch={setActiveCockBatch}
              onDeleteBatch={deleteCockBatch}
              onUpdateBatch={updateCockBatch}
            />
          ) : system.activeType === 'sonali' ? (
            <SonaliSection
              batches={system.sonaliBatches || []}
              activeBatch={activeSonaliBatch}
              activeBatchId={system.activeSonaliBatchId}
              onAddBatch={addSonaliBatch}
              onSelectBatch={setActiveSonaliBatch}
              onDeleteBatch={deleteSonaliBatch}
              onUpdateBatch={updateSonaliBatch}
            />
          ) : system.activeType === 'broiler' ? (
            <BroilerSection
              batches={system.broilerBatches || []}
              activeBatch={activeBroilerBatch}
              activeBatchId={system.activeBroilerBatchId}
              onAddBatch={addBroilerBatch}
              onSelectBatch={setActiveBroilerBatch}
              onDeleteBatch={deleteBroilerBatch}
              onUpdateBatch={updateBroilerBatch}
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {POULTRY_TYPES.find((t) => t.id === system.activeType)?.label} এর হিসাব শীঘ্রই আসছে।
            </div>
          )
        )}

        {isLayer && <>
        {/* Financial Summary - Always visible */}
        <FinancialSummary
          totalIncome={monthlyTotalIncome}
          totalExpense={monthlyTotalExpense}
          netProfit={monthlyNetProfit}
          currentMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-16 bg-secondary mb-2">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <BarChart3 className="w-4 h-4" />
              {t('charts')}
            </TabsTrigger>
            <TabsTrigger 
              value="expenses" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Calculator className="w-4 h-4" />
              {t('expenses')}
            </TabsTrigger>
            <TabsTrigger 
              value="sales" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Egg className="w-4 h-4" />
              {t('sales')}
            </TabsTrigger>
            <TabsTrigger 
              value="flock" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Bird className="w-4 h-4" />
              {t('flock')}
            </TabsTrigger>
            <TabsTrigger 
              value="medicine" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Syringe className="w-4 h-4" />
              {t('medicine')}
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4 h-16 bg-secondary">
            <TabsTrigger 
              value="feed" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Package className="w-4 h-4" />
              {t('feed')}
            </TabsTrigger>
            <TabsTrigger 
              value="production" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <TrendingUp className="w-4 h-4" />
              {t('production')}
            </TabsTrigger>
            <TabsTrigger 
              value="mortality" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Skull className="w-4 h-4" />
              {t('mortality')}
            </TabsTrigger>
            <TabsTrigger 
              value="dealer" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Store className="w-4 h-4" />
              {t('dealer')}
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4 h-16 bg-secondary mt-2">
            <TabsTrigger 
              value="medicine-expense" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Pill className="w-4 h-4" />
              {t('medicineExpense')}
            </TabsTrigger>
            <TabsTrigger 
              value="misc-expense" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Receipt className="w-4 h-4" />
              {t('misc')}
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <FileText className="w-4 h-4" />
              {t('report')}
            </TabsTrigger>
            <TabsTrigger 
              value="batch" 
              className="flex flex-col items-center gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2"
            >
              <Layers className="w-4 h-4" />
              {t('batch')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="dashboard" className="mt-0">
              <DashboardCharts farmData={farmData} selectedMonth={selectedMonth} />
            </TabsContent>

            <TabsContent value="expenses" className="mt-0">
              <MonthlyExpenseForm
                currentMonth={selectedMonth}
                existingExpense={currentExpense}
                dailyExpense={dailyExpense}
                onSave={addMonthlyExpense}
              />
            </TabsContent>

            <TabsContent value="sales" className="mt-0">
              <EggSalesTracker
                sales={farmData.eggSales}
                onAddSale={addEggSale}
                onEditSale={editEggSale}
                onDeleteSale={deleteEggSale}
              />
            </TabsContent>

            <TabsContent value="flock" className="mt-0 space-y-4">
              <ChickenAgeTracker
                arrivalDate={farmData.flockInfo?.arrivalDate || ''}
                onSetArrivalDate={setChickenArrivalDate}
              />
              <VaccineRecommendation arrivalDate={farmData.flockInfo?.arrivalDate || ''} />
            </TabsContent>

            <TabsContent value="feed" className="mt-0">
              <FeedTracker
                feedPurchases={farmData.flockInfo?.feedPurchases || []}
                dealers={farmData.dealers}
                onAddPurchase={addFeedPurchase}
                onEditPurchase={editFeedPurchase}
                onDeletePurchase={deleteFeedPurchase}
              />
            </TabsContent>

            <TabsContent value="production" className="mt-0">
              <EggProductionTracker
                eggProductions={farmData.flockInfo?.eggProductions || []}
                liveChickenCount={getLiveChickenCount()}
                onAddProduction={addEggProduction}
                onEditProduction={editEggProduction}
                onDeleteProduction={deleteEggProduction}
              />
            </TabsContent>

            <TabsContent value="mortality" className="mt-0">
              <MortalityTracker
                initialCount={farmData.flockInfo?.initialCount || 0}
                mortalityRecords={farmData.flockInfo?.mortalityRecords || []}
                onSetInitialCount={setInitialChickenCount}
                onAddMortality={addMortalityRecord}
                onEditMortality={editMortalityRecord}
                onDeleteMortality={deleteMortalityRecord}
              />
            </TabsContent>

            <TabsContent value="medicine" className="mt-0 space-y-4">
              <div className="flex justify-end">
                <ReminderSettings 
                  reminderDays={reminderDays}
                  onChangeReminderDays={updateReminderDays}
                />
              </div>
              <MedicineScheduler
                schedules={farmData.medicineSchedules}
                reminderDays={reminderDays}
                onSetFirstDate={setMedicineFirstDate}
                onMarkGiven={markMedicineGiven}
                onResetStatus={resetMedicineStatus}
                onUpdateNotes={updateMedicineNotes}
              />
            </TabsContent>

            <TabsContent value="dealer" className="mt-0">
              <DealerTracker
                dealers={farmData.dealers}
                feedPurchases={farmData.flockInfo?.feedPurchases || []}
                totalPayments={totalDealerPayments}
                onAddDealer={addDealer}
                onDeleteDealer={deleteDealer}
                onUpdateOpeningDue={updateDealerOpeningDue}
                onUpdateBalanceType={updateDealerBalanceType}
                onAddPayment={addDealerPayment}
                onEditPayment={editDealerPayment}
                onDeletePayment={deleteDealerPayment}
              />
            </TabsContent>

            <TabsContent value="report" className="mt-0 space-y-4">
              <PDFReportGenerator farmData={farmData} selectedMonth={selectedMonth} />
              <DataExport farmData={farmData} />
              <ReportGenerator 
                farmData={farmData}
                selectedMonth={selectedMonth}
              />
            </TabsContent>

            <TabsContent value="medicine-expense" className="mt-0">
              <MedicineExpenseTracker
                medicinePurchases={farmData.flockInfo?.medicinePurchases || []}
                onAddPurchase={addMedicinePurchase}
                onEditPurchase={editMedicinePurchase}
                onDeletePurchase={deleteMedicinePurchase}
              />
            </TabsContent>

            <TabsContent value="misc-expense" className="mt-0">
              <MiscExpenseTracker
                miscExpenses={farmData.flockInfo?.miscExpenses || []}
                onAddExpense={addMiscExpense}
                onEditExpense={editMiscExpense}
                onDeleteExpense={deleteMiscExpense}
              />
            </TabsContent>

            <TabsContent value="batch" className="mt-0">
              <LayerBatchManager
                batches={layerBatches}
                activeBatchId={activeLayerBatchId}
                farmData={farmData}
                onAdd={addLayerBatch}
                onSwitch={switchLayerBatch}
                onRename={renameLayerBatch}
                onDelete={deleteLayerBatch}
              />
            </TabsContent>
          </div>
        </Tabs>
        </>}


        {/* Footer */}
        <motion.footer 
          className="text-center py-4 text-muted-foreground text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>© ২০২৬ Smart Poultry</p>
          <p className="mt-0.5">আপনার খামারের সেরা সঙ্গী 🐔</p>
        </motion.footer>
      </div>

      {/* Signup Prompt for Guest Users */}
      <SignupPrompt 
        open={showSignupPrompt} 
        onClose={() => setShowSignupPrompt(false)} 
      />

      <MyPoultrySettings
        open={showPoultrySettings}
        onOpenChange={setShowPoultrySettings}
        enabledTypes={system.enabledTypes.length ? system.enabledTypes : ['layer']}
        onAdd={addPoultryType}
        onRemove={removePoultryType}
      />

      <SideDrawer
        open={showSideDrawer}
        onOpenChange={setShowSideDrawer}
        onOpenProfile={() => setShowProfileView(true)}
        onOpenPoultrySettings={() => setShowPoultrySettings(true)}
        onOpenSetupWizard={() => setShowSetupWizardModal(true)}
        onOpenDriveBackup={() => toast.info('Google Drive ব্যাকআপ অপশন সক্রিয় রয়েছে')}
        onOpenAiAssistant={() => setShowAiAssistant(true)}
        enabledTypes={system.enabledTypes.length ? system.enabledTypes : ['layer']}
        activeType={system.activeType}
        onSelectType={setActiveType}
        isLoggedIn={!!user}
        onSignOut={handleSignOut}
        onSignIn={() => navigate('/auth')}
        userMobile={user?.email}
      />

      <AIAssistantModal
        open={showAiAssistant}
        onOpenChange={setShowAiAssistant}
        initialMode="general"
      />
    </div>
  );
};

export default Index;
