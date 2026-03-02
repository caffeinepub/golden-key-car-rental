import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Menu, X, Key, Bell } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useNotifications } from '../contexts/NotificationContext';
import LanguageToggle from './LanguageToggle';
import LoginButton from './LoginButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { unreadCount } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = !!identity;

  const navLinks = [
    { label: t.nav.home, to: '/' },
    { label: t.nav.cars, to: '/cars' },
    { label: t.nav.blog, to: '/blog' },
    ...(isAuthenticated ? [{ label: t.nav.dashboard, to: '/dashboard' }] : []),
    ...(isAdmin ? [{ label: t.nav.admin, to: '/admin' }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-deep-black/95 backdrop-blur-sm border-b border-gold/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/assets/generated/golden-key-logo.dim_400x120.png"
              alt="Golden Key Car Rental"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-gold transition-colors rounded-sm hover:bg-gold/5 [&.active]:text-gold [&.active]:font-semibold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-gold"
                onClick={() => navigate({ to: '/dashboard', search: { tab: 'notifications' } as any })}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gold text-deep-black text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            <LanguageToggle />
            <LoginButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-charcoal border-t border-gold/20 py-4">
          <div className="container mx-auto px-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-gold transition-colors rounded-sm hover:bg-gold/5 [&.active]:text-gold"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-2 border-t border-border mt-2">
              <LanguageToggle />
              <LoginButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
