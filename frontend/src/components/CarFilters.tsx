import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export interface FilterState {
  category: string;
  transmission: string;
  location: string;
  minPrice: number;
  maxPrice: number;
  seats: string;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: string[];
  locations: string[];
}

export default function CarFilters({ filters, onChange, categories, locations }: Props) {
  const { t } = useLanguage();

  const update = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({ category: '', transmission: '', location: '', minPrice: 0, maxPrice: 2000, seats: '' });
  };

  return (
    <div className="bg-charcoal border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">{t.cars.filters}</h3>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-gold h-7 px-2 text-xs">
          <X className="w-3 h-3 me-1" />{t.cars.clearFilters}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3">
        {/* Category */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">{t.cars.category}</Label>
          <Select value={filters.category || 'all'} onValueChange={(v) => update('category', v === 'all' ? '' : v)}>
            <SelectTrigger className="bg-charcoal-mid border-border h-8 text-xs">
              <SelectValue placeholder={t.cars.allCategories} />
            </SelectTrigger>
            <SelectContent className="bg-charcoal border-border">
              <SelectItem value="all">{t.cars.allCategories}</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Transmission */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">{t.cars.transmission}</Label>
          <Select value={filters.transmission || 'all'} onValueChange={(v) => update('transmission', v === 'all' ? '' : v)}>
            <SelectTrigger className="bg-charcoal-mid border-border h-8 text-xs">
              <SelectValue placeholder={t.cars.allTransmissions} />
            </SelectTrigger>
            <SelectContent className="bg-charcoal border-border">
              <SelectItem value="all">{t.cars.allTransmissions}</SelectItem>
              <SelectItem value="Automatic">{t.cars.automatic}</SelectItem>
              <SelectItem value="Manual">{t.cars.manual}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">{t.cars.location}</Label>
          <Select value={filters.location || 'all'} onValueChange={(v) => update('location', v === 'all' ? '' : v)}>
            <SelectTrigger className="bg-charcoal-mid border-border h-8 text-xs">
              <SelectValue placeholder={t.cars.allLocations} />
            </SelectTrigger>
            <SelectContent className="bg-charcoal border-border">
              <SelectItem value="all">{t.cars.allLocations}</SelectItem>
              {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Seats */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">{t.cars.seats}</Label>
          <Select value={filters.seats || 'all'} onValueChange={(v) => update('seats', v === 'all' ? '' : v)}>
            <SelectTrigger className="bg-charcoal-mid border-border h-8 text-xs">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-charcoal border-border">
              <SelectItem value="all">Any</SelectItem>
              {['2', '4', '5', '7', '8'].map(s => <SelectItem key={s} value={s}>{s}+</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          {t.cars.priceRange}: ${filters.minPrice} – ${filters.maxPrice}
        </Label>
        <Slider
          min={0}
          max={2000}
          step={50}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => onChange({ ...filters, minPrice: min, maxPrice: max })}
          className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold"
        />
      </div>
    </div>
  );
}
