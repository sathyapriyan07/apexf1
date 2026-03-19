import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Driver, Constructor, Race } from '../types';
import Card from '../components/Card';
import { Search as SearchIcon } from 'lucide-react';
import { DriverCard } from '../components/ui/driver-card';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ drivers: Driver[], constructors: Constructor[], races: Race[] }>({
    drivers: [],
    constructors: [],
    races: []
  });
  const [driverCards, setDriverCards] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        handleSearch();
      } else {
        setResults({ drivers: [], constructors: [], races: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const [driversRes, constructorsRes, racesRes] = await Promise.all([
        supabase.from('drivers').select('*').ilike('name', `%${query}%`).limit(10),
        supabase.from('constructors').select('*').ilike('name', `%${query}%`).limit(10),
        supabase.from('races').select('*, season:seasons(*)').ilike('name', `%${query}%`).limit(10)
      ]);

      setResults({
        drivers: driversRes.data || [],
        constructors: constructorsRes.data || [],
        races: racesRes.data || []
      });

      const ids = (driversRes.data || []).map((d: any) => d.id);
      if (ids.length) {
        const cardRes = await supabase.from('driver_cards').select('*').in('driver_id', ids);
        if (!cardRes.error && cardRes.data) {
          const map: Record<string, any> = {};
          for (const row of cardRes.data as any[]) map[row.driver_id] = row;
          setDriverCards(map);
        } else {
          setDriverCards({});
        }
      } else {
        setDriverCards({});
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-8">Search Archive</h1>
          
          <div className="relative group">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input
              type="text"
              autoFocus
              placeholder="Search for drivers, teams, or races..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-3xl px-16 py-6 text-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all backdrop-blur-xl"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
          </div>
        )}

        {!loading && query.length > 2 && (
          <div className="space-y-16">
            {results.drivers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-red-600 rounded-full" />
                  Drivers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.drivers.map(driver => (
                    <DriverCard
                      key={driver.id}
                      id={driver.id}
                      name={driver.name}
                      team={driverCards[driver.id]?.team ?? ''}
                      image={driver.image_url || ''}
                      banner={driverCards[driver.id]?.team_logo_url ?? ''}
                      wins={driverCards[driver.id]?.wins ?? 0}
                      seasons={
                        driverCards[driver.id]?.start_year && driverCards[driver.id]?.end_year
                          ? `${driverCards[driver.id].start_year}–${driverCards[driver.id].end_year}`
                          : ''
                      }
                      points={driverCards[driver.id]?.points ?? 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {results.constructors.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-red-600 rounded-full" />
                  Constructors
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  {results.constructors.map(c => (
                    <Card
                      key={c.id}
                      title={c.name}
                      imageUrl={c.logo_url || "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=400"}
                      href={`/constructors/${c.id}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {results.races.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-red-600 rounded-full" />
                  Races
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.races.map(race => (
                    <Card
                      key={race.id}
                      title={race.name}
                      subtitle={`${race.circuit} • ${race.season?.year}`}
                      imageUrl={race.image_url || "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800"}
                      href={`/races/${race.id}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {results.drivers.length === 0 && results.constructors.length === 0 && results.races.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No results found for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
