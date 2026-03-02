import React from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export default function AccessDeniedScreen() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">{t.accessDenied.title}</h1>
          <p className="text-muted-foreground">{t.accessDenied.message}</p>
          <p className="text-muted-foreground text-sm mt-1">{t.accessDenied.adminRequired}</p>
        </div>
        <Button asChild className="bg-gold text-deep-black hover:bg-gold-light">
          <Link to="/">{t.accessDenied.goHome}</Link>
        </Button>
      </div>
    </div>
  );
}
