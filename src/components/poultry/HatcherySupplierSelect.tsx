import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export interface PredefinedHatcheryOption {
  label: string;
  en: string;
  bn: string;
}

export const PREDEFINED_HATCHERIES: readonly PredefinedHatcheryOption[] = [
  { label: 'Kazi / কাজী', en: 'Kazi', bn: 'কাজী' },
  { label: 'CP / সিপি', en: 'CP', bn: 'সিপি' },
  { label: 'Nourish / নওরিশ', en: 'Nourish', bn: 'নওরিশ' },
  { label: 'Paragon / প্যারাগন', en: 'Paragon', bn: 'প্যারাগন' },
  { label: 'Aftab / আফতাব', en: 'Aftab', bn: 'আফতাব' },
  { label: 'Nahar / নাহার', en: 'Nahar', bn: 'নাহার' },
  { label: 'ACI / এসিআই', en: 'ACI', bn: 'এসিআই' },
] as const;

interface Props {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  id?: string;
}

export function HatcherySupplierSelect({
  value = '',
  onChange,
  label = 'হ্যাচারি / সরবরাহকারী (ঐচ্ছিক)',
  helperText = 'বাচ্চা কোথা থেকে কিনেছেন সেই হ্যাচারি/কোম্পানির নাম নির্বাচন করুন',
  id,
}: Props) {
  const findPredefined = (val?: string): PredefinedHatcheryOption | undefined => {
    if (!val || !val.trim()) return undefined;
    const trimmed = val.trim().toLowerCase();
    return PREDEFINED_HATCHERIES.find(
      (h) =>
        h.label.toLowerCase() === trimmed ||
        h.en.toLowerCase() === trimmed ||
        h.bn.toLowerCase() === trimmed
    );
  };

  const getInitialMode = (val?: string): { selectValue: string; customText: string } => {
    if (!val || !val.trim()) {
      return { selectValue: '', customText: '' };
    }
    const matched = findPredefined(val);
    if (matched) {
      return { selectValue: matched.label, customText: '' };
    }
    return { selectValue: 'other', customText: val };
  };

  const [selectedOption, setSelectedOption] = useState<string>(() => getInitialMode(value).selectValue);
  const [customText, setCustomText] = useState<string>(() => getInitialMode(value).customText);

  // Sync state when external value changes
  useEffect(() => {
    const mode = getInitialMode(value);
    setSelectedOption(mode.selectValue);
    setCustomText(mode.customText);
  }, [value]);

  const handleSelectChange = (newVal: string) => {
    setSelectedOption(newVal);
    if (newVal === 'other') {
      onChange(customText.trim());
    } else {
      setCustomText('');
      onChange(newVal);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomText(text);
    onChange(text);
  };

  const handleClear = () => {
    setSelectedOption('');
    setCustomText('');
    onChange('');
  };

  return (
    <div className="space-y-1.5" id={id}>
      <div className="flex items-center justify-between">
        <Label className="text-xs sm:text-sm font-medium">{label}</Label>
        {selectedOption ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-0.5"
            onClick={handleClear}
            title="মুছে ফেলুন"
          >
            <X className="w-3 h-3" />
            <span>মুছুন</span>
          </Button>
        ) : null}
      </div>

      <Select value={selectedOption} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full h-9 text-sm">
          <SelectValue placeholder="হ্যাচারি/কোম্পানি নির্বাচন করুন" />
        </SelectTrigger>
        <SelectContent>
          {PREDEFINED_HATCHERIES.map((company) => (
            <SelectItem key={company.label} value={company.label}>
              {company.label}
            </SelectItem>
          ))}
          <SelectItem value="other">অন্যান্য</SelectItem>
        </SelectContent>
      </Select>

      <p className="text-[11px] text-muted-foreground leading-tight">{helperText}</p>

      {selectedOption === 'other' && (
        <div className="pt-1">
          <Input
            placeholder="হ্যাচারি/সরবরাহকারীর নাম লিখুন"
            value={customText}
            onChange={handleCustomChange}
            autoFocus
            className="h-9 text-sm"
          />
        </div>
      )}
    </div>
  );
}
