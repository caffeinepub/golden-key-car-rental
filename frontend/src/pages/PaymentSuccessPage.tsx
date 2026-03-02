import React from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export default function PaymentSuccessPage() {
  const { t } = useLanguage();
  const search = useSearch({ strict: false }) as any;
  const bookingId = search?.bookingId ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">{t.payment.success}</h1>
          <p className="text-muted-foreground">{t.payment.successDesc}</p>
        </div>
        {bookingId && (
          <div className="bg-charcoal border border-gold/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{t.payment.bookingRef}</p>
            <p className="font-mono font-bold text-gold mt-1">{bookingId}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-gold text-deep-black hover:bg-gold-light font-semibold">
            <Link to="/dashboard">
              {t.payment.viewBookings}
              <ArrowRight className="w-4 h-4 ms-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-border text-foreground hover:bg-charcoal-mid">
            <Link to="/">{t.payment.goHome}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
