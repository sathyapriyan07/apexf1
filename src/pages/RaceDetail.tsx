import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Race, Result } from '../types';
import Hero from '../components/Hero';
import { Trophy, MapPin, Calendar, Play } from 'lucide-react';
import { getYouTubeEmbedUrl, cn } from '../lib/utils';

export default function RaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const [raceRes, resultsRes] = await Promise.all([
        supabase.from('races').select('*, season:seasons(*)').eq('id', id).single(),
        supabase.from('results').select('*, driver:drivers(*), constructor:constructors(*)').eq('race_id', id).order('position', { ascending: true })
      ]);

      if (raceRes.data) setRace(raceRes.data);
      if (resultsRes.data) setResults(resultsRes.data);
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

  if (!race) return <div className="text-white p-20">Race not found.</div>;

  const winner = results.find(r => r.position === 1);
  const fastestLap = results.find(r => r.fastest_lap);
  const embedUrl = race.youtube_url ? getYouTubeEmbedUrl(race.youtube_url) : null;

  return (
    <div className="bg-black min-h-screen pb-20">
      <Hero
        title={race.name}
        subtitle={`${race.season?.year} Grand Prix`}
        description={`The battle at ${race.circuit}. Relive the high-speed drama and historic moments of this legendary race.`}
        imageUrl={race.image_url || "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1920"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Race Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Race Summary
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <MapPin className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Circuit</p>
                    <p className="text-lg font-bold">{race.circuit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <Calendar className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Date</p>
                    <p className="text-lg font-bold">{new Date(race.date).toLocaleDateString()}</p>
                  </div>
                </div>
                {winner && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Trophy className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Winner</p>
                      <Link to={`/drivers/${winner.driver?.id}`} className="text-lg font-bold hover:text-red-500 transition-colors">
                        {winner.driver?.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Highlights */}
            {embedUrl && (
              <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl overflow-hidden">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Play className="text-red-600" />
                  Highlights
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Race Highlights"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Table */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-8">Race Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 font-bold">Pos</th>
                      <th className="pb-4 font-bold">Driver</th>
                      <th className="pb-4 font-bold">Constructor</th>
                      <th className="pb-4 font-bold text-right">Grid</th>
                      <th className="pb-4 font-bold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.map((result) => (
                      <tr key={result.id} className={cn(
                        "group hover:bg-white/5 transition-colors",
                        result.fastest_lap && "bg-purple-500/5"
                      )}>
                        <td className="py-4 font-mono text-lg">
                          {result.position === 0 ? 'DNF' : result.position}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/drivers/${result.driver?.id}`} className="font-bold hover:text-red-500 transition-colors">
                              {result.driver?.name}
                            </Link>
                            {result.fastest_lap && (
                              <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">Fastest</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-gray-400 text-sm">
                          <Link to={`/constructors/${result.constructor?.id}`} className="hover:text-white transition-colors">
                            {result.constructor?.name}
                          </Link>
                        </td>
                        <td className="py-4 text-right font-mono text-gray-500">{result.grid}</td>
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
