import React from 'react';
import { Link } from '@tanstack/react-router';
import { Users, Fuel, Settings, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../contexts/LanguageContext';
import type { Car } from '../backend';

interface Props {
  car: Car;
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', AED: 'AED', EUR: '€' };

export default function CarCard({ car }: Props) {
  const { t } = useLanguage();

  const imageUrl = car.images.length > 0 ? car.images[0].getDirectURL() : null;

  return (
    <Link to="/cars/$carId" params={{ carId: car.id }} className="block group">
      <div className="luxury-card transition-all duration-300 group-hover:border-gold/40 group-hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-48 bg-charcoal-mid overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src="/assets/generated/empty-state-icon.dim_256x256.png" alt="" className="w-16 h-16 opacity-30" />
            </div>
          )}
          <div className="absolute top-3 start-3">
            <Badge className={`text-xs font-medium ${car.isAvailable ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
              {car.isAvailable ? t.cars.available : t.cars.unavailable}
            </Badge>
          </div>
          <div className="absolute top-3 end-3">
            <Badge variant="secondary" className="bg-charcoal/80 text-gold border-gold/30 text-xs">
              {car.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
            {car.year.toString()} {car.make} {car.model}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              {car.transmission}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {car.seatCount.toString()}
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              {car.fuelType}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            {car.location}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-gold">${car.dailyRate.toFixed(0)}</span>
              <span className="text-xs text-muted-foreground ms-1">{t.cars.perDay}</span>
            </div>
            <span className="text-xs font-medium text-gold border border-gold/30 px-3 py-1 rounded-sm hover:bg-gold/10 transition-colors">
              {t.cars.viewDetails}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
