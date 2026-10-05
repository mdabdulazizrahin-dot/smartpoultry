import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardHeaderProps {
  farmName: string;
  onUpdateName: (name: string) => void;
}

export function DashboardHeader({ farmName, onUpdateName }: DashboardHeaderProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(farmName);

  useEffect(() => {
    setEditName(farmName);
  }, [farmName]);

  const handleSave = () => {
    if (editName.trim()) {
      onUpdateName(editName.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(farmName);
    setIsEditing(false);
  };

  return (
    <motion.header 
      className="bg-gradient-farm text-primary-foreground rounded-2xl p-6 shadow-card"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <motion.div 
            className="header-icon-3d text-4xl"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            🐔
          </motion.div>
          
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                key="editing"
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 text-lg font-semibold min-w-[280px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleSave}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Check className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleCancel}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="display"
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold">{farmName}</h1>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsEditing(true)}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <motion.p 
        className="mt-3 text-primary-foreground/80 text-sm text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t('allFarmRecordsInOnePlace')}
      </motion.p>
    </motion.header>
  );
}
