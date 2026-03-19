import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DriverCard } from '../components/ui/driver-card';

type DriverCardRow = {
  driver_id: string;
  name: string;
  nationality: string;
  image_url: string | null;
  wins: number;
  points: number;
  start_year: number | null;
  end_year: number | null;
  team: string | null;
  team_logo_url: string | null;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<DriverCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await supabase
          .from('driver_cards')
          .select('*')
          .order('wins', { ascending: false })
          .order('points', { ascending: false });

        if (res.error) throw res.error;
        setDrivers((res.data as any[]) as DriverCardRow[]);
      } catch (err) {
        console.error('Failed to load driver cards:', err);
        // fallback: basic driver list (no stats)
        const fallback = await supabase.from('drivers').select('*').order('name');
        setDrivers(
          (fallback.data || []).map((d: any) => ({
            driver_id: d.id,
            name: d.name,
            nationality: d.nationality,
            image_url: d.image_url ?? null,
            wins: 0,
            points: 0,
            start_year: null,
            end_year: null,
            team: null,
            team_logo_url: null,
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter(d =>
      `${d.name} ${d.team ?? ''} ${d.nationality ?? ''}`.toLowerCase().includes(q)
    );
  }, [drivers, query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Drivers</h1>
          <p className="text-xl text-gray-400">Explore every driver in the archive and jump into full profiles.</p>
        </div>

        <div className="mb-10">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search drivers, teams, or nationality..."
              className="w-full bg-zinc-900/50 border border-white/10 rounded-3xl px-14 py-5 text-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all backdrop-blur-xl"
            />
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filtered.map(d => {
            const seasons =
              d.start_year && d.end_year ? `${d.start_year}–${d.end_year}` : '';
            return (
              <motion.div key={d.driver_id} variants={item}>
                <DriverCard
                  id={d.driver_id}
                  name={d.name}
                  team={d.team ?? ''}
                  image={d.image_url ?? ''}
                  banner={d.team_logo_url ?? ''}
                  wins={d.wins ?? 0}
                  seasons={seasons}
                  points={d.points ?? 0}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No drivers found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

