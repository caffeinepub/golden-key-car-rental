import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useValidatePromoCode } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { PromoCode } from '../backend';

interface Props {
  onPromoApplied: (promo: PromoCode | null) => void;
  appliedPromo: PromoCode | null;
}

export default function PromoCodeInput({ onPromoApplied, appliedPromo }: Props) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const validateMutation = useValidatePromoCode();

  const handleApply = async () => {
    if (!code.trim()) return;
    setError('');
    try {
      const promo = await validateMutation.mutateAsync(code.trim().toUpperCase());
      onPromoApplied(promo);
    } catch {
      setError(t.pricing.invalidPromo);
      onPromoApplied(null);
    }
  };

  const handleRemove = () => {
    onPromoApplied(null);
    setCode('');
    setError('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          placeholder={t.pricing.promoCode}
          disabled={!!appliedPromo}
          className="bg-charcoal-mid border-border text-foreground placeholder:text-muted-foreground uppercase"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        {appliedPromo ? (
          <Button variant="outline" size="sm" onClick={handleRemove} className="border-destructive text-destructive hover:bg-destructive/10 shrink-0">
            <XCircle className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleApply}
            disabled={validateMutation.isPending || !code.trim()}
            size="sm"
            className="bg-gold text-deep-black hover:bg-gold-light shrink-0"
          >
            {validateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.pricing.applyPromo}
          </Button>
        )}
      </div>
      {appliedPromo && (
        <p className="text-xs text-success flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          {t.pricing.promoApplied} ({appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}% off` : `$${appliedPromo.discountValue} off`})
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
