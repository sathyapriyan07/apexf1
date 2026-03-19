import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Season, Race, Result } from '../types';
import Hero from '../components/Hero';
import { Trophy, Calendar as CalendarIcon, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { DriverCard } from '../components/ui/driver-card';

export default function SeasonDetail() {
  const { id } = useParams<{ id: string }>();
  const [season, setSeason] = useState<Season | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replayMode, setReplayMode] = useState(false);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(-1);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      const [seasonRes, racesRes] = await Promise.all([
        supabase.from('seasons').select('*, champion_driver:drivers(*), champion_constructor:constructors(*)').eq('id', id).single(),
        supabase.from('races').select('*').eq('season_id', id).order('date', { ascending: true }),
      ]);

      if (seasonRes.data) setSeason(seasonRes.data);
      if (racesRes.data) {
        setRaces(racesRes.data);
        
        // Fetch all results for this season's races
        const raceIds = racesRes.data.map(r => r.id);
        if (raceIds.length > 0) {
          const { data: resultsData } = await supabase
            .from('results')
            .select('*, driver:drivers(*), constructor:constructors(*)')
            .in('race_id', raceIds);
          
          if (resultsData) {
            setAllResults(resultsData);
            calculateStandings(resultsData, -1, racesRes.data);
          }
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  const calculateStandings = (results: any[], raceIndex: number, allRaces: Race[]) => {
    const driverPoints: Record<string, any> = {};
    
    // Filter results up to the current race in replay
    const relevantRaceIds = raceIndex === -1 
      ? allRaces.map(r => r.id) // If not in replay mode (or at end), show all
      : allRaces.slice(0, raceIndex + 1).map(r => r.id);

    const filteredResults = results.filter(r => relevantRaceIds.includes(r.race_id));

    filteredResults.forEach(r => {
      if (!driverPoints[r.driver_id]) {
        driverPoints[r.driver_id] = {
          driver: r.driver,
          constructor: r.constructor,
          points: 0,
          wins: 0
        };
      }
      driverPoints[r.driver_id].points += r.points;
      if (r.position === 1) driverPoints[r.driver_id].wins += 1;
    });
    
    const sortedStandings = Object.values(driverPoints).sort((a, b) => b.points - a.points);
    setStandings(sortedStandings);
  };

  useEffect(() => {
    if (allResults.length > 0 && races.length > 0) {
      calculateStandings(allResults, replayMode ? currentRaceIndex : -1, races);
    }
  }, [replayMode, currentRaceIndex, allResults, races]);

  const toggleReplay = () => {
    setReplayMode(!replayMode);
    setCurrentRaceIndex(replayMode ? -1 : 0);
  };

  const nextRace = () => {
    if (currentRaceIndex < races.length - 1) {
      setCurrentRaceIndex(prev => prev + 1);
    }
  };

  const prevRace = () => {
    if (currentRaceIndex > 0) {
      setCurrentRaceIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!season) return <div className="text-white p-20">Season not found.</div>;

  return (
    <div className="bg-black min-h-screen pb-20">
      <Hero
        title={`${season.year} Season`}
        subtitle="Season Overview"
        description={`The ${season.year} Formula One World Championship featured ${races.length} races across the globe.`}
        imageUrl="https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&q=80&w=1920"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleReplay}
            className={cn(
              "px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
              replayMode 
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                : "bg-zinc-900 text-gray-400 border border-white/10 hover:bg-zinc-800"
            )}
          >
            <CalendarIcon size={18} />
            {replayMode ? "Exit Replay Mode" : "Season Replay Mode"}
          </button>
        </div>

        {replayMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/80 backdrop-blur-xl border border-red-500/30 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl">
                {currentRaceIndex + 1}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Currently Viewing</p>
                <h4 className="text-xl font-bold text-white">{races[currentRaceIndex]?.name}</h4>
                <p className="text-sm text-gray-500">{new Date(races[currentRaceIndex]?.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={prevRace}
                disabled={currentRaceIndex === 0}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft />
              </button>
              <div className="flex gap-1">
                {races.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      idx === currentRaceIndex ? "bg-red-600 w-4" : idx < currentRaceIndex ? "bg-red-600/40" : "bg-white/10"
                    )}
                  />
                ))}
              </div>
              <button
                onClick={nextRace}
                disabled={currentRaceIndex === races.length - 1}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight />
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Champions Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                Champions
              </h3>
              <div className="space-y-6">
                {season.champion_driver && (
                  <div className="flex items-center gap-4">
                    <img src={season.champion_driver.image_url} className="w-16 h-16 rounded-2xl object-cover border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">World Champion</p>
                      <Link to={`/drivers/${season.champion_driver.id}`} className="text-lg font-bold hover:text-red-500 transition-colors">
                        {season.champion_driver.name}
                      </Link>
                    </div>
                  </div>
                )}
                {season.champion_constructor && (
                  <div className="flex items-center gap-4">
                    <img src={season.champion_constructor.logo_url} className="w-16 h-16 rounded-2xl object-contain bg-white/5 p-2 border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Constructor Champion</p>
                      <Link to={`/constructors/${season.champion_constructor.id}`} className="text-lg font-bold hover:text-red-500 transition-colors">
                        {season.champion_constructor.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CalendarIcon className="text-red-500" />
                Race Calendar
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {races.map((race, index) => (
                  <Link
                    key={race.id}
                    to={`/races/${race.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm">{index + 1}</span>
                      <div>
                        <p className="font-bold text-sm group-hover:text-red-500 transition-colors">{race.name}</p>
                        <p className="text-xs text-gray-500">{new Date(race.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Standings Table */}
          <div className="lg:col-span-2">
            {standings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-white">Top Drivers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {standings.slice(0, 3).map((entry) => (
                    <DriverCard
                      key={entry.driver.id}
                      id={entry.driver.id}
                      name={entry.driver.name}
                      team={entry.constructor?.name ?? ''}
                      image={entry.driver.image_url ?? ''}
                      banner={entry.constructor?.logo_url ?? ''}
                      wins={entry.wins ?? 0}
                      seasons={String(season.year)}
                      points={entry.points ?? 0}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <User className="text-blue-500" />
                {replayMode ? `Standings after Round ${currentRaceIndex + 1}` : 'Final Standings'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 font-bold">Pos</th>
                      <th className="pb-4 font-bold">Driver</th>
                      <th className="pb-4 font-bold">Constructor</th>
                      <th className="pb-4 font-bold text-right">Wins</th>
                      <th className="pb-4 font-bold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {standings.map((entry, index) => (
                      <tr key={entry.driver.id} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 font-mono text-lg">{index + 1}</td>
                        <td className="py-4">
                          <Link to={`/drivers/${entry.driver.id}`} className="font-bold hover:text-red-500 transition-colors">
                            {entry.driver.name}
                          </Link>
                        </td>
                        <td className="py-4 text-gray-400 text-sm">{entry.constructor?.name || 'N/A'}</td>
                        <td className="py-4 text-right font-mono">{entry.wins}</td>
                        <td className="py-4 text-right font-bold text-red-500">{entry.points}</td>
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
