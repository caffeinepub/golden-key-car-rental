import React from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export default function PaymentFailurePage() {
  const { t } = useLanguage();
  const search = useSearch({ strict: false }) as any;
  const bookingId = search?.bookingId ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">{t.payment.failure}</h1>
          <p className="text-muted-foreground">{t.payment.failureDesc}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-gold text-deep-black hover:bg-gold-light font-semibold">
            <Link to="/cars">
              <RefreshCw className="w-4 h-4 me-2" />
              {t.payment.tryAgain}
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
