import { Check, ChevronDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { POULTRY_TYPES, PoultryTypeId } from '@/types/poultry';

interface Props {
  enabledTypes: PoultryTypeId[];
  activeType: PoultryTypeId;
  onSelect: (t: PoultryTypeId) => void;
  onOpenSettings: () => void;
}

export function PoultrySelector({ enabledTypes, activeType, onSelect, onOpenSettings }: Props) {
  const active = POULTRY_TYPES.find((t) => t.id === activeType) || POULTRY_TYPES[0];
  const list = POULTRY_TYPES.filter((t) => enabledTypes.includes(t.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <span>{active.emoji}</span>
          <span>{active.label}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover z-50">
        {list.map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => onSelect(t.id)} className="gap-2">
            <span>{t.emoji}</span>
            <span className="flex-1">{t.label}</span>
            {t.id === activeType && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings} className="gap-2">
          <Settings2 className="w-4 h-4" />
          আমার মুরগি (সেটিংস)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
