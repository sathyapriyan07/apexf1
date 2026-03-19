import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Constructor, Result } from '../types';
import Hero from '../components/Hero';
import { Trophy, Users, History } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ConstructorDetail() {
  const { id } = useParams<{ id: string }>();
  const [constructor, setConstructor] = useState<Constructor | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState({ wins: 0, podiums: 0, races: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const [constructorRes, resultsRes] = await Promise.all([
        supabase.from('constructors').select('*').eq('id', id).single(),
        supabase.from('results').select('*, race:races(*), driver:drivers(*)').eq('constructor_id', id).order('race:races.date', { ascending: false })
      ]);

      if (constructorRes.data) setConstructor(constructorRes.data);
      if (resultsRes.data) {
        setResults(resultsRes.data);
        const wins = resultsRes.data.filter(r => r.position === 1).length;
        const podiums = resultsRes.data.filter(r => r.position >= 1 && r.position <= 3).length;
        setStats({ wins, podiums, races: resultsRes.data.length });
      }
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!constructor) return <div className="text-white p-20">Constructor not found.</div>;

  return (
    <div className="bg-black min-h-screen pb-20">
      <Hero
        title={constructor.name}
        subtitle="Constructor Profile"
        description={constructor.history || `The legacy of ${constructor.name} in Formula One. Explore their championship history and legendary drivers.`}
        imageUrl="https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=1920"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats Grid */}
          <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Wins', value: stats.wins, icon: Trophy, color: 'text-yellow-500' },
              { label: 'Podiums', value: stats.podiums, icon: Trophy, color: 'text-blue-500' },
              { label: 'Total Races', value: stats.races, icon: History, color: 'text-red-500' },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center gap-4">
                <div className={cn("p-3 bg-white/5 rounded-2xl", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Results History */}
          <div className="lg:col-span-4">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Users className="text-red-500" />
                Race History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 font-bold">Race</th>
                      <th className="pb-4 font-bold">Driver</th>
                      <th className="pb-4 font-bold text-right">Grid</th>
                      <th className="pb-4 font-bold text-right">Pos</th>
                      <th className="pb-4 font-bold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.map((result) => (
                      <tr key={result.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <Link to={`/races/${result.race?.id}`} className="font-bold hover:text-red-500 transition-colors">
                            {result.race?.name}
                          </Link>
                          <p className="text-xs text-gray-500">{new Date(result.race?.date || '').getFullYear()}</p>
                        </td>
                        <td className="py-4">
                          <Link to={`/drivers/${result.driver?.id}`} className="text-gray-400 hover:text-white transition-colors">
                            {result.driver?.name}
                          </Link>
                        </td>
                        <td className="py-4 text-right font-mono text-gray-500">{result.grid}</td>
                        <td className="py-4 text-right font-mono">
                          <span className={cn(
                            "px-2 py-1 rounded-md font-bold",
                            result.position === 1 ? "bg-yellow-500/20 text-yellow-500" : 
                            result.position <= 3 && result.position > 0 ? "bg-blue-500/20 text-blue-500" : ""
                          )}>
                            {result.position === 0 ? 'DNF' : result.position}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold text-red-500">{result.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
