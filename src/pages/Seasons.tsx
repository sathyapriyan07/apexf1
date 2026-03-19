import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Season } from '../types';
import Card from '../components/Card';
import { motion } from 'framer-motion';

export default function Seasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchSeasons() {
      const timeout = setTimeout(() => setLoading(false), 5000);
      try {
        const { data, error } = await supabase
          .from('seasons')
          .select('*, champion_driver:drivers(*), champion_constructor:constructors(*)')
          .eq('published', true)
          .order('year', { ascending: false });

        if (data) setSeasons(data);
        if (error) throw error;
      } catch (err) {
        console.error('Error fetching seasons:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }
    fetchSeasons();
  }, []);

  const decades = ['all', '2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s', '1950s'];

  const filteredSeasons = seasons.filter(s => {
    if (filter === 'all') return true;
    const startYear = parseInt(filter.substring(0, 4));
    return s.year >= startYear && s.year < startYear + 10;
  });

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
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Seasons</h1>
          <p className="text-xl text-gray-400">Explore the history of Formula One, year by year.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {decades.map(d => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                filter === d ? 'bg-red-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
              }`}
            >
              {d === 'all' ? 'All Time' : d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSeasons.map((season) => (
            <Card
              key={season.id}
              title={`${season.year} Season`}
              subtitle={season.champion_driver ? `Champion: ${season.champion_driver.name}` : 'No data'}
              imageUrl="https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800"
              href={`/seasons/${season.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
