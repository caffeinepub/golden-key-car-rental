import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { MapPin, Users, Fuel, Settings, Calendar, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetCar, useGetUserBookings } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AddOnsSelector from '../components/AddOnsSelector';
import PricingCalculator from '../components/PricingCalculator';
import PromoCodeInput from '../components/PromoCodeInput';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';
import type { PromoCode } from '../backend';
import type { DateRange } from 'react-day-picker';

export default function CarDetailPage() {
  const { carId } = useParams({ from: '/cars/$carId' });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const { data: car, isLoading } = useGetCar(carId);
  const { data: userBookings = [] } = useGetUserBookings(identity?.getPrincipal());

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [earlyPayment, setEarlyPayment] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const startDate = dateRange?.from ?? null;
  const endDate = dateRange?.to ?? null;

  const hasCompletedBooking = userBookings.some(
    b => b.carId === carId && b.bookingStatus === 'completed'
  );

  const handleBookNow = () => {
    if (!identity) {
      return;
    }
    navigate({
      to: '/booking',
      search: {
        carId,
        startDate: startDate?.toISOString() ?? '',
        endDate: endDate?.toISOString() ?? '',
        addOns: selectedAddOns.join(','),
        currency,
        earlyPayment: earlyPayment ? '1' : '0',
        promoCode: promoCode?.code ?? '',
      } as any,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-96 bg-charcoal-mid rounded-lg mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 bg-charcoal-mid rounded" />
            <Skeleton className="h-32 bg-charcoal-mid rounded" />
          </div>
          <Skeleton className="h-64 bg-charcoal-mid rounded" />
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Car not found.</p>
        <Button onClick={() => navigate({ to: '/cars' })} className="mt-4 bg-gold text-deep-black">
          Back to Fleet
        </Button>
      </div>
    );
  }

  const images = car.images.map(img => img.getDirectURL());

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/cars' })}
          className="mb-6 text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="w-4 h-4 me-2" />
          Back to Fleet
        </Button>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-72 md:h-96 bg-charcoal-mid rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img src="/assets/generated/empty-state-icon.dim_256x256.png" alt="" className="w-24 h-24 opacity-30" />
              </div>
            )}
            <div className="absolute top-4 end-4">
              <Badge className={car.isAvailable ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                {car.isAvailable ? t.cars.available : t.cars.unavailable}
              </Badge>
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${i === currentImageIndex ? 'border-gold' : 'border-border'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-3xl font-bold text-foreground">
                  {car.year.toString()} {car.make} {car.model}
                </h1>
                <div className="text-end shrink-0">
                  <span className="text-3xl font-bold text-gold">${car.dailyRate.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">{t.cars.perDay}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span className="text-muted-foreground text-sm">{car.location}</span>
              </div>
            </div>

            {/* Specs */}
            <div className="bg-charcoal border border-border rounded-lg p-4">
              <h2 className="font-serif font-semibold text-foreground mb-4">{t.carDetail.specifications}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: t.carDetail.year, value: car.year.toString() },
                  { label: t.carDetail.make, value: car.make },
                  { label: t.carDetail.model, value: car.model },
                  { label: t.carDetail.fuelType, value: car.fuelType },
                  { label: t.carDetail.transmission, value: car.transmission },
                  { label: t.carDetail.seats, value: car.seatCount.toString() },
                  { label: t.carDetail.category, value: car.category },
                  { label: t.carDetail.location, value: car.location },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-charcoal-mid rounded p-3">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <div className="bg-charcoal border border-border rounded-lg p-4">
                <h2 className="font-serif font-semibold text-foreground mb-3">{t.carDetail.description}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{car.description}</p>
              </div>
            )}

            {/* Feature Tags */}
            {car.featureTags.length > 0 && (
              <div className="bg-charcoal border border-border rounded-lg p-4">
                <h2 className="font-serif font-semibold text-foreground mb-3">{t.carDetail.features}</h2>
                <div className="flex flex-wrap gap-2">
                  {car.featureTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-gold/10 text-gold border-gold/30">
                      <Tag className="w-3 h-3 me-1" />{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            <div className="bg-charcoal border border-border rounded-lg p-4">
              <h2 className="font-serif font-semibold text-foreground mb-4">{t.carDetail.addOns}</h2>
              <AddOnsSelector selected={selectedAddOns} onChange={setSelectedAddOns} />
            </div>

            {/* Promo Code */}
            <div className="bg-charcoal border border-border rounded-lg p-4">
              <h2 className="font-serif font-semibold text-foreground mb-3">{t.pricing.promoCode}</h2>
              <PromoCodeInput onPromoApplied={setPromoCode} appliedPromo={promoCode} />
            </div>

            {/* Reviews */}
            <div className="bg-charcoal border border-border rounded-lg p-4">
              <h2 className="font-serif font-semibold text-foreground mb-4">{t.carDetail.reviews}</h2>
              <ReviewForm carId={carId} hasCompletedBooking={hasCompletedBooking} />
              <div className="mt-4">
                <ReviewsList carId={carId} />
              </div>
            </div>
          </div>

          {/* Right: Booking Panel */}
          <div className="space-y-4">
            {/* Date Picker */}
            <div className="bg-charcoal border border-border rounded-lg p-4">
              <h2 className="font-serif font-semibold text-foreground mb-3">{t.carDetail.selectDates}</h2>
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={{ before: new Date() }}
                className="rounded-md bg-charcoal-mid p-2 w-full"
              />
              {startDate && endDate && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>{t.carDetail.startDate}:</span>
                    <span className="text-foreground">{startDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.carDetail.endDate}:</span>
                    <span className="text-foreground">{endDate.toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <PricingCalculator
              dailyRate={car.dailyRate}
              startDate={startDate}
              endDate={endDate}
              selectedAddOns={selectedAddOns}
              promoCode={promoCode}
              currency={currency}
              onCurrencyChange={setCurrency}
              earlyPayment={earlyPayment}
              onEarlyPaymentChange={setEarlyPayment}
            />

            {/* Book Button */}
            <Button
              onClick={handleBookNow}
              disabled={!car.isAvailable || !startDate || !endDate}
              className="w-full bg-gold text-deep-black hover:bg-gold-light font-semibold h-12 text-base"
            >
              {!identity ? 'Login to Book' : t.carDetail.bookNow}
            </Button>
            {!car.isAvailable && (
              <p className="text-xs text-destructive text-center">{t.cars.unavailable}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
