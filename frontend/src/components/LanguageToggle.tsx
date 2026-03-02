import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="text-gold border border-gold/30 hover:bg-gold/10 hover:text-gold font-medium px-3 py-1 h-8 text-sm rounded-sm"
      aria-label="Toggle language"
    >
      {language === 'en' ? 'عربي' : 'EN'}
    </Button>
  );
}
