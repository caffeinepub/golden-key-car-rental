import React, { useState } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { Check, Loader2, CreditCard, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '../contexts/LanguageContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCar, useGetCallerUserProfile, useAddBooking, useCreateCheckoutSession } from '../hooks/useQueries';
import { calculateTotal } from '../components/PricingCalculator';
import { ADD_ON_PRICES } from '../components/AddOnsSelector';
import { toast } from 'sonner';
import type { ShoppingItem } from '../backend';

const STEPS = ['step1', 'step2', 'step3'] as const;

export default function BookingFlowPage() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as any;

  const carId = search?.carId ?? '';
  const startDateStr = search?.startDate ?? '';
  const endDateStr = search?.endDate ?? '';
  const addOnsStr = search?.addOns ?? '';
  const currency = search?.currency ?? 'USD';
  const earlyPayment = search?.earlyPayment === '1';
  const promoCodeStr = search?.promoCode ?? '';

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;
  const selectedAddOns = addOnsStr ? addOnsStr.split(',').filter(Boolean) : [];

  const { data: car } = useGetCar(carId);
  const { data: userProfile } = useGetCallerUserProfile();
  const addBookingMutation = useAddBooking();
  const checkoutMutation = useCreateCheckoutSession();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: userProfile?.name ?? '',
    email: userProfile?.email ?? '',
    phone: userProfile?.phone ?? '',
  });

  React.useEffect(() => {
    if (userProfile) {
      setForm({ name: userProfile.name, email: userProfile.email, phone: userProfile.phone });
    }
  }, [userProfile]);

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please login to continue with your booking.</p>
          <Button onClick={() => navigate({ to: '/cars' })} className="bg-gold text-deep-black">
            Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const calc = car ? calculateTotal(car.dailyRate, days, selectedAddOns, null, earlyPayment, currency) : null;

  const stepLabels = [t.booking.step1, t.booking.step2, t.booking.step3];

  const handlePayment = async () => {
    if (!car || !identity || !calc) return;
    try {
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const booking = {
        id: bookingId,
        carId: car.id,
        userId: identity.getPrincipal(),
        startDate: BigInt(startDate?.getTime() ?? Date.now()) * BigInt(1_000_000),
        endDate: BigInt(endDate?.getTime() ?? Date.now()) * BigInt(1_000_000),
        addOns: selectedAddOns,
        promoCode: promoCodeStr || undefined,
        totalPrice: calc.total,
        currency,
        paymentStatus: 'pending',
        bookingStatus: 'pending',
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
      };

      await addBookingMutation.mutateAsync(booking);

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const items: ShoppingItem[] = [{
        productName: `${car.make} ${car.model} Rental`,
        productDescription: `${days} day rental from ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`,
        quantity: BigInt(1),
        priceInCents: BigInt(Math.round(calc.total * 100)),
        currency: currency.toLowerCase(),
      }];

      const session = await checkoutMutation.mutateAsync({
        items,
        successUrl: `${baseUrl}/payment-success?bookingId=${bookingId}`,
        cancelUrl: `${baseUrl}/payment-failure?bookingId=${bookingId}`,
      });

      if (!session?.url) throw new Error('Stripe session missing url');
      window.location.href = session.url;
    } catch (err: any) {
      toast.error(err?.message || t.general.error);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">{t.booking.title}</h1>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  i < step ? 'bg-gold text-deep-black' :
                  i === step ? 'bg-gold text-deep-black ring-4 ring-gold/30' :
                  'bg-charcoal-mid text-muted-foreground border border-border'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-gold font-medium' : 'text-muted-foreground'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px mx-3 mb-5 ${i < step ? 'bg-gold' : 'bg-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Booking Summary */}
        {car && (
          <div className="bg-charcoal border border-border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-foreground text-sm mb-3">{t.booking.bookingSummary}</h3>
            <div className="flex items-center gap-3">
              {car.images.length > 0 && (
                <img src={car.images[0].getDirectURL()} alt="" className="w-16 h-12 object-cover rounded" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">{car.year.toString()} {car.make} {car.model}</p>
                {startDate && endDate && (
                  <p className="text-xs text-muted-foreground">
                    {startDate.toLocaleDateString()} → {endDate.toLocaleDateString()} ({days} days)
                  </p>
                )}
              </div>
              {calc && (
                <div className="text-end">
                  <p className="font-bold text-gold">${calc.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{currency}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-charcoal border border-border rounded-lg p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-semibold text-foreground">{t.booking.step1}</h2>
              </div>
              <div>
                <Label className="text-foreground">{t.booking.name} *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t.booking.namePlaceholder}
                  className="bg-charcoal-mid border-border mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">{t.booking.email} *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder={t.booking.emailPlaceholder}
                  className="bg-charcoal-mid border-border mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">{t.booking.phone}</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder={t.booking.phonePlaceholder}
                  className="bg-charcoal-mid border-border mt-1"
                />
              </div>
              <Button
                onClick={() => setStep(1)}
                disabled={!form.name || !form.email}
                className="w-full bg-gold text-deep-black hover:bg-gold-light font-semibold mt-2"
              >
                {t.booking.next}
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-semibold text-foreground">{t.booking.step2}</h2>
              </div>
              {selectedAddOns.length === 0 ? (
                <p className="text-muted-foreground text-sm">No add-ons selected.</p>
              ) : (
                <div className="space-y-2">
                  {selectedAddOns.map(id => (
                    <div key={id} className="flex justify-between text-sm p-3 bg-charcoal-mid rounded">
                      <span className="text-foreground capitalize">{id.replace(/_/g, ' ')}</span>
                      <span className="text-gold">+${ADD_ON_PRICES[id] ?? 0}/day</span>
                    </div>
                  ))}
                </div>
              )}
              {calc && (
                <>
                  <Separator className="bg-border" />
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">{t.booking.total}</span>
                    <span className="text-gold">${calc.total.toFixed(2)} {currency}</span>
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 border-border text-foreground hover:bg-charcoal-mid">
                  {t.booking.back}
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1 bg-gold text-deep-black hover:bg-gold-light font-semibold">
                  {t.booking.next}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-semibold text-foreground">{t.booking.step3}</h2>
              </div>
              <div className="p-4 bg-charcoal-mid rounded-lg border border-gold/20 text-sm space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.booking.name}:</span><span className="text-foreground">{form.name}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.booking.email}:</span><span className="text-foreground">{form.email}</span>
                </div>
                {calc && (
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span className="text-foreground">{t.booking.total}:</span>
                    <span className="text-gold">${calc.total.toFixed(2)} {currency}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-border text-foreground hover:bg-charcoal-mid">
                  {t.booking.back}
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={checkoutMutation.isPending || addBookingMutation.isPending}
                  className="flex-1 bg-gold text-deep-black hover:bg-gold-light font-semibold"
                >
                  {(checkoutMutation.isPending || addBookingMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 animate-spin me-2" />{t.booking.processing}</>
                  ) : t.booking.payNow}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
