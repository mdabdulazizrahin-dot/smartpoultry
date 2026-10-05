import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { POULTRY_TYPES, PoultryTypeId } from '@/types/poultry';
import { Plus, Minus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  enabledTypes: PoultryTypeId[];
  onAdd: (t: PoultryTypeId) => void;
  onRemove: (t: PoultryTypeId) => void;
}

export function MyPoultrySettings({ open, onOpenChange, enabledTypes, onAdd, onRemove }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>আমার মুরগি</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          কোনো ধরন বন্ধ করলে তার পুরনো তথ্য মুছে যাবে না — শুধু ড্যাশবোর্ড থেকে লুকানো থাকবে।
        </p>
        <div className="space-y-2">
          {POULTRY_TYPES.map((t) => {
            const on = enabledTypes.includes(t.id);
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border"
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="flex-1 font-medium">{t.label}</span>
                {on ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(t.id)}
                    disabled={enabledTypes.length <= 1}
                  >
                    <Minus className="w-4 h-4" /> বন্ধ
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onAdd(t.id)}>
                    <Plus className="w-4 h-4" /> যোগ
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
