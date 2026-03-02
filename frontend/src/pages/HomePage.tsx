import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Shield, Clock, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetCars } from '../hooks/useQueries';
import CarCard from '../components/CarCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { t } = useLanguage();
  const { data: cars = [], isLoading } = useGetCars();
  const featuredCars = cars.filter(c => c.isAvailable).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/generated/hero-banner.dim_1920x900.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-black/70 via-deep-black/50 to-deep-black" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-sm font-medium">{t.hero.subtitle}</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            {t.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gold text-deep-black hover:bg-gold-light font-semibold text-base px-8">
              <Link to="/cars">
                {t.hero.cta}
                <ArrowRight className="w-5 h-5 ms-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-gold/40 text-foreground hover:bg-gold/10 hover:border-gold text-base px-8">
              <Link to="/blog">{t.nav.blog}</Link>
            </Button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-gold/40" />
          <div className="w-2 h-2 rounded-full bg-gold/60" />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Fully Insured', desc: 'All vehicles come with comprehensive insurance coverage' },
              { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock customer service for your peace of mind' },
              { icon: Star, title: 'Premium Fleet', desc: 'Handpicked luxury vehicles maintained to the highest standards' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-6 bg-charcoal-mid rounded-lg border border-border hover:border-gold/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-3">{t.cars.title}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.cars.subtitle}</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 bg-charcoal-mid rounded-lg" />)}
            </div>
          ) : featuredCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCars.map(car => <CarCard key={car.id} car={car} />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <img src="/assets/generated/fleet-showcase.dim_1200x500.png" alt="Fleet" className="w-full max-w-2xl mx-auto rounded-lg opacity-60 mb-6" />
              <p className="text-muted-foreground">Our fleet is being updated. Check back soon!</p>
            </div>
          )}

          {featuredCars.length > 0 && (
            <div className="text-center mt-10">
              <Button asChild size="lg" className="bg-gold text-deep-black hover:bg-gold-light font-semibold">
                <Link to="/cars">
                  View All Vehicles
                  <ArrowRight className="w-5 h-5 ms-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-charcoal border-y border-gold/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold text-foreground mb-4">Ready to Drive in Style?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Book your luxury vehicle today and experience the Golden Key difference.
          </p>
          <Button asChild size="lg" className="bg-gold text-deep-black hover:bg-gold-light font-semibold px-10">
            <Link to="/cars">{t.hero.ctaBook}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
