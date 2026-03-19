import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Award, Zap, History } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Records() {
  const [records, setRecords] = useState<any>({
    mostWins: [],
    mostPoles: [],
    mostPodiums: [],
    mostChampionships: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      const { data: allTimeStats } = await supabase
        .from('all_time_records')
        .select('*');

      if (allTimeStats) {
        // Map view data to the structure expected by the UI
        const mappedStats = allTimeStats.map(s => ({
          driver: {
            id: s.driver_id,
            name: s.driver_name,
            image_url: s.driver_image_url,
            nationality: s.driver_nationality
          },
          wins: s.wins,
          podiums: s.podiums,
          poles: s.poles
        }));

        setRecords({
          mostWins: [...mappedStats].sort((a, b) => b.wins - a.wins).slice(0, 10),
          mostPoles: [...mappedStats].sort((a, b) => b.poles - a.poles).slice(0, 10),
          mostPodiums: [...mappedStats].sort((a, b) => b.podiums - a.podiums).slice(0, 10),
        });
      }
      setLoading(false);
    }
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const RecordSection = ({ title, icon: Icon, data, field, label }: any) => (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <Icon className="text-red-600" />
        {title}
      </h3>
      <div className="space-y-4">
        {data.map((item: any, index: number) => (
          <div key={item.driver.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-mono text-lg w-6">{index + 1}</span>
              <img src={item.driver.image_url} className="w-10 h-10 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
              <Link to={`/drivers/${item.driver.id}`} className="font-bold group-hover:text-red-500 transition-colors">
                {item.driver.name}
              </Link>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{item[field]}</span>
              <span className="text-xs text-gray-500 uppercase font-bold ml-2">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Hall of Fame</h1>
          <p className="text-xl text-gray-400">The greatest records and achievements in Formula One history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <RecordSection title="Most Wins" icon={Trophy} data={records.mostWins} field="wins" label="Wins" />
          <RecordSection title="Most Poles" icon={Zap} data={records.mostPoles} field="poles" label="Poles" />
          <RecordSection title="Most Podiums" icon={Award} data={records.mostPodiums} field="podiums" label="Podiums" />
        </div>
      </div>
    </div>
  );
}
