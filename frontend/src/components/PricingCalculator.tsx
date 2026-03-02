import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ADD_ON_PRICES } from './AddOnsSelector';
import type { PromoCode } from '../backend';

const CURRENCIES = ['USD', 'AED', 'EUR'];
const EXCHANGE_RATES: Record<string, number> = { USD: 1, AED: 3.67, EUR: 0.92 };
const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', AED: 'AED ', EUR: '€' };
const EARLY_PAYMENT_DISCOUNT = 0.10;

interface Props {
  dailyRate: number;
  startDate: Date | null;
  endDate: Date | null;
  selectedAddOns: string[];
  promoCode: PromoCode | null;
  currency: string;
  onCurrencyChange: (c: string) => void;
  earlyPayment: boolean;
  onEarlyPaymentChange: (v: boolean) => void;
}

export function calculateTotal(
  dailyRate: number,
  days: number,
  addOns: string[],
  promoCode: PromoCode | null,
  earlyPayment: boolean,
  currency: string
) {
  const addOnTotal = addOns.reduce((sum, id) => sum + (ADD_ON_PRICES[id] || 0), 0) * days;
  const subtotal = dailyRate * days + addOnTotal;
  let discount = 0;
  if (promoCode) {
    if (promoCode.discountType === 'percentage') {
      discount = subtotal * (promoCode.discountValue / 100);
    } else {
      discount = promoCode.discountValue;
    }
  }
  const earlyDiscount = earlyPayment ? (subtotal - discount) * EARLY_PAYMENT_DISCOUNT : 0;
  const totalUSD = Math.max(0, subtotal - discount - earlyDiscount);
  const rate = EXCHANGE_RATES[currency] || 1;
  return {
    days,
    dailyRateConverted: dailyRate * rate,
    addOnTotal: addOnTotal * rate,
    subtotal: subtotal * rate,
    promoDiscount: discount * rate,
    earlyDiscount: earlyDiscount * rate,
    total: totalUSD * rate,
    symbol: CURRENCY_SYMBOLS[currency] || '$',
  };
}

export default function PricingCalculator({
  dailyRate, startDate, endDate, selectedAddOns, promoCode,
  currency, onCurrencyChange, earlyPayment, onEarlyPaymentChange
}: Props) {
  const { t } = useLanguage();

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const calc = days > 0 ? calculateTotal(dailyRate, days, selectedAddOns, promoCode, earlyPayment, currency) : null;

  return (
    <div className="bg-charcoal border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        {/* Use t.carDetail.pricing instead of t.pricing.pricing */}
        <h3 className="font-serif font-semibold text-foreground">{t.carDetail.pricing}</h3>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-24 h-7 text-xs bg-charcoal-mid border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-charcoal border-border">
            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Early Payment Toggle */}
      <div className="flex items-center justify-between p-3 bg-gold/5 border border-gold/20 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">{t.pricing.earlyPayment}</p>
          <p className="text-xs text-muted-foreground">Save 10% on total</p>
        </div>
        <Switch
          checked={earlyPayment}
          onCheckedChange={onEarlyPaymentChange}
          className="data-[state=checked]:bg-gold"
        />
      </div>

      {calc ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{calc.symbol}{(calc.dailyRateConverted).toFixed(2)} × {calc.days} {t.pricing.days}</span>
            <span>{calc.symbol}{(calc.dailyRateConverted * calc.days).toFixed(2)}</span>
          </div>
          {calc.addOnTotal > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t.pricing.addOns}</span>
              <span>+{calc.symbol}{calc.addOnTotal.toFixed(2)}</span>
            </div>
          )}
          {calc.promoDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>{t.pricing.promoDiscount}</span>
              <span>-{calc.symbol}{calc.promoDiscount.toFixed(2)}</span>
            </div>
          )}
          {calc.earlyDiscount > 0 && (
            <div className="flex justify-between text-success">
              <span>{t.pricing.earlyPaymentDiscount}</span>
              <span>-{calc.symbol}{calc.earlyDiscount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="bg-border" />
          <div className="flex justify-between font-bold text-lg">
            <span className="text-foreground">{t.pricing.total}</span>
            <span className="text-gold">{calc.symbol}{calc.total.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">{t.carDetail.selectDates}</p>
      )}
    </div>
  );
}
