import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetCars } from '../hooks/useQueries';
import CarCard from '../components/CarCard';
import CarFilters, { type FilterState } from '../components/CarFilters';

export default function CarListingsPage() {
  const { t } = useLanguage();
  const { data: cars = [], isLoading } = useGetCars();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    transmission: '',
    location: '',
    minPrice: 0,
    maxPrice: 2000,
    seats: '',
  });

  const categories = useMemo(() => [...new Set(cars.map(c => c.category))], [cars]);
  const locations = useMemo(() => [...new Set(cars.map(c => c.location))], [cars]);

  const filtered = useMemo(() => {
    return cars.filter(car => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${car.make} ${car.model} ${car.category} ${car.location}`.toLowerCase().includes(q);
      const matchCategory = !filters.category || car.category === filters.category;
      const matchTransmission = !filters.transmission || car.transmission === filters.transmission;
      const matchLocation = !filters.location || car.location === filters.location;
      const matchPrice = car.dailyRate >= filters.minPrice && car.dailyRate <= filters.maxPrice;
      const matchSeats = !filters.seats || Number(car.seatCount) >= Number(filters.seats);
      return matchSearch && matchCategory && matchTransmission && matchLocation && matchPrice && matchSeats;
    });
  }, [cars, search, filters]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-3">{t.cars.title}</h1>
          <p className="text-muted-foreground">{t.cars.subtitle}</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.cars.search}
            className="ps-10 bg-charcoal border-border text-foreground placeholder:text-muted-foreground h-12"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <CarFilters
              filters={filters}
              onChange={setFilters}
              categories={categories}
              locations={locations}
            />
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'vehicle' : 'vehicles'} found
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-72 bg-charcoal-mid rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <img
                  src="/assets/generated/empty-state-icon.dim_256x256.png"
                  alt="No results"
                  className="w-24 h-24 mx-auto mb-4 opacity-40"
                />
                <h3 className="font-serif text-xl text-foreground mb-2">{t.cars.noResults}</h3>
                <p className="text-muted-foreground">{t.cars.noResultsDesc}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(car => <CarCard key={car.id} car={car} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
