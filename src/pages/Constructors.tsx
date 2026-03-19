import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Constructor } from '../types';
import Card from '../components/Card';

export default function Constructors() {
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      let didTimeout = false;
      const timeout = setTimeout(() => {
        didTimeout = true;
        setError('Request timed out. Check Supabase/RLS and your network, then retry.');
        setLoading(false);
      }, 8000);

      try {
        const { data, error } = await supabase
          .from('constructors')
          .select('id, name, logo_url, history')
          .order('name');
        if (error) throw error;
        if (!didTimeout) setConstructors(data || []);
      } catch (err) {
        console.error('Error fetching constructors:', err);
        if (!didTimeout) setError((err as any)?.message ?? 'Failed to load constructors');
      } finally {
        clearTimeout(timeout);
        if (!didTimeout) setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return constructors;
    return constructors.filter(c => c.name.toLowerCase().includes(q));
  }, [constructors, query]);

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
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Constructors</h1>
          <p className="text-xl text-gray-400">Browse every F1 constructor in the archive.</p>
        </div>

        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4">
            <p className="font-bold">Couldn’t load constructors</p>
            <p className="text-sm text-red-200/80 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-10">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search constructors..."
              className="w-full bg-zinc-900/50 border border-white/10 rounded-3xl px-14 py-5 text-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all backdrop-blur-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {filtered.map((c) => (
            <Card
              key={c.id}
              title={c.name}
              imageUrl={
                c.logo_url ||
                'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=400'
              }
              href={`/constructors/${c.id}`}
              aspectRatio="square"
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No constructors found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
