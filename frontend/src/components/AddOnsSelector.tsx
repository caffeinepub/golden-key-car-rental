import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Baby, UserPlus, Infinity } from 'lucide-react';

export const ADD_ON_PRICES: Record<string, number> = {
  'child_seat': 15,
  'additional_driver': 25,
  'unlimited_km': 30,
};

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const ADD_ONS = [
  { id: 'child_seat', icon: Baby, labelKey: 'childSeat' as const, descKey: 'childSeatDesc' as const },
  { id: 'additional_driver', icon: UserPlus, labelKey: 'additionalDriver' as const, descKey: 'additionalDriverDesc' as const },
  { id: 'unlimited_km', icon: Infinity, labelKey: 'unlimitedKm' as const, descKey: 'unlimitedKmDesc' as const },
];

export default function AddOnsSelector({ selected, onChange }: Props) {
  const { t } = useLanguage();

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      {ADD_ONS.map(({ id, icon: Icon, labelKey, descKey }) => (
        <div
          key={id}
          className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
            selected.includes(id)
              ? 'border-gold/60 bg-gold/5'
              : 'border-border hover:border-gold/30 hover:bg-charcoal-mid'
          }`}
          onClick={() => toggle(id)}
        >
          <Checkbox
            checked={selected.includes(id)}
            onCheckedChange={() => toggle(id)}
            className="border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold"
          />
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t.addOns[labelKey]}</p>
            <p className="text-xs text-muted-foreground">{t.addOns[descKey]}</p>
          </div>
          <span className="text-sm font-semibold text-gold">+${ADD_ON_PRICES[id]}/day</span>
        </div>
      ))}
    </div>
  );
}
