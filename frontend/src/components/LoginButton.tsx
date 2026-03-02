import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      variant={isAuthenticated ? 'ghost' : 'default'}
      size="sm"
      className={
        isAuthenticated
          ? 'text-muted-foreground hover:text-foreground border border-border hover:bg-secondary'
          : 'bg-gold text-deep-black hover:bg-gold-light font-semibold'
      }
    >
      {isLoggingIn ? (
        <><Loader2 className="w-4 h-4 animate-spin me-2" />{t.nav.loggingIn}</>
      ) : isAuthenticated ? (
        <><LogOut className="w-4 h-4 me-2" />{t.nav.logout}</>
      ) : (
        <><LogIn className="w-4 h-4 me-2" />{t.nav.login}</>
      )}
    </Button>
  );
}
