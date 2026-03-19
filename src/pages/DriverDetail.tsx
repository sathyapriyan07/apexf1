import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Driver, Result } from '../types';
import Hero from '../components/Hero';
import { Trophy, Flag, Calendar, Award } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState({ wins: 0, podiums: 0, poles: 0, races: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const [driverRes, resultsRes] = await Promise.all([
        supabase.from('drivers').select('*').eq('id', id).single(),
        supabase.from('results').select('*, race:races(*), constructor:constructors(*)').eq('driver_id', id).order('race:races.date', { ascending: false })
      ]);

      if (driverRes.data) setDriver(driverRes.data);
      if (resultsRes.data) {
        setResults(resultsRes.data);
        const wins = resultsRes.data.filter(r => r.position === 1).length;
        const podiums = resultsRes.data.filter(r => r.position >= 1 && r.position <= 3).length;
        const poles = resultsRes.data.filter(r => r.grid === 1).length;
        setStats({ wins, podiums, poles, races: resultsRes.data.length });
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

  if (!driver) return <div className="text-white p-20">Driver not found.</div>;

  return (
    <div className="bg-black min-h-screen pb-20">
      <Hero
        title={driver.name}
        subtitle={driver.nationality}
        description={driver.bio || `Explore the legendary career of ${driver.name}. From their debut to their greatest victories in Formula One.`}
        imageUrl={driver.image_url || "https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=1920"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats Grid */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Wins', value: stats.wins, icon: Trophy, color: 'text-yellow-500' },
              { label: 'Podiums', value: stats.podiums, icon: Award, color: 'text-blue-500' },
              { label: 'Poles', value: stats.poles, icon: Flag, color: 'text-red-500' },
              { label: 'Races', value: stats.races, icon: Calendar, color: 'text-green-500' },
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

          {/* Career History */}
          <div className="lg:col-span-4">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-8">Career Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 font-bold">Race</th>
                      <th className="pb-4 font-bold">Constructor</th>
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
                          <Link to={`/constructors/${result.constructor?.id}`} className="text-gray-400 hover:text-white transition-colors">
                            {result.constructor?.name}
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
