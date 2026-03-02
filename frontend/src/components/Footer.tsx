import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Heart, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscribeToNewsletter } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const subscribeMutation = useSubscribeToNewsletter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await subscribeMutation.mutateAsync({
        name,
        email,
        subscribedAt: BigInt(Date.now()) * BigInt(1_000_000),
      });
      toast.success(t.newsletter.success);
      setEmail('');
      setName('');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already')) {
        toast.error(t.newsletter.duplicate);
      } else {
        toast.error(t.newsletter.error);
      }
    }
  };

  const appId = encodeURIComponent(window.location.hostname || 'golden-key-car-rental');

  return (
    <footer className="bg-charcoal border-t border-gold/20 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="/assets/generated/golden-key-logo.dim_400x120.png"
              alt="Golden Key Car Rental"
              className="h-10 w-auto object-contain mb-4"
            />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium car rental experience with an exclusive fleet of luxury vehicles.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a href="tel:+971000000000" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-gold" />
                +971 00 000 0000
              </a>
              <a href="mailto:info@goldenkey.ae" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
                <Mail className="w-4 h-4 text-gold" />
                info@goldenkey.ae
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-gold" />
                Dubai, UAE
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-foreground font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              {[
                { label: t.nav.home, to: '/' },
                { label: t.nav.cars, to: '/cars' },
                { label: t.nav.blog, to: '/blog' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-foreground font-semibold mb-2">{t.newsletter.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t.newsletter.subtitle}</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input
                type="text"
                placeholder={t.newsletter.name}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-charcoal-mid border-border text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t.newsletter.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-charcoal-mid border-border text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="bg-gold text-deep-black hover:bg-gold-light font-semibold shrink-0"
                >
                  {subscribeMutation.isPending ? t.newsletter.subscribing : t.newsletter.subscribe}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gold/20 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Golden Key Car Rental L.L.C. {t.footer.rights}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {t.footer.builtWith} <Heart className="w-4 h-4 text-gold fill-gold" /> {t.footer.using}{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-light transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
