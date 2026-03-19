import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Result, Race, Driver, Constructor } from '../../types';
import { Plus, Trash2, X, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    driver_id: '',
    constructor_id: '',
    position: 1,
    points: 0,
    grid: 1,
    fastest_lap: false
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRaceId) {
      fetchResults();
    } else {
      setResults([]);
    }
  }, [selectedRaceId]);

  async function fetchInitialData() {
    const [racesRes, driversRes, constructorsRes] = await Promise.all([
      supabase.from('races').select('*, season:seasons(*)').order('date', { ascending: false }),
      supabase.from('drivers').select('*').order('name'),
      supabase.from('constructors').select('*').order('name')
    ]);

    if (racesRes.data) setRaces(racesRes.data);
    if (driversRes.data) setDrivers(driversRes.data);
    if (constructorsRes.data) setConstructors(constructorsRes.data);
    setLoading(false);
  }

  async function fetchResults() {
    const { data } = await supabase
      .from('results')
      .select('*, driver:drivers(*), constructor:constructors(*)')
      .eq('race_id', selectedRaceId)
      .order('position', { ascending: true });
    
    if (data) setResults(data);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaceId) return;
    setLoading(true);

    try {
      await supabase.from('results').insert([{
        ...formData,
        race_id: selectedRaceId
      }]);
      setIsModalOpen(false);
      setFormData({ driver_id: '', constructor_id: '', position: results.length + 1, points: 0, grid: 1, fastest_lap: false });
      fetchResults();
    } catch (error) {
      console.error('Error saving result:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('results').delete().eq('id', id);
    fetchResults();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Race Results</h1>
          <p className="text-gray-400">Add and manage results for each Grand Prix.</p>
        </div>
        {selectedRaceId && (
          <button
            onClick={() => {
              setFormData({ ...formData, position: results.length + 1 });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Result
          </button>
        )}
      </div>

      <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <Filter className="text-gray-500" />
          <select
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
          >
            <option value="">Select a Race to manage results</option>
            {races.map(r => (
              <option key={r.id} value={r.id}>
                {r.season?.year} - {r.name} ({r.circuit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRaceId ? (
        <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Pos</th>
                <th className="px-6 py-4 font-bold">Driver</th>
                <th className="px-6 py-4 font-bold">Constructor</th>
                <th className="px-6 py-4 font-bold text-right">Points</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold">{r.position === 0 ? 'DNF' : r.position}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{r.driver?.name}</span>
                      {r.fastest_lap && <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">FL</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{r.constructor?.name}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500">{r.points}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No results added for this race yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-white/10 rounded-3xl">
          <p className="text-gray-500">Please select a race from the dropdown above to manage results.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Race Result</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Driver</label>
                  <select
                    required
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Constructor</label>
                  <select
                    required
                    value={formData.constructor_id}
                    onChange={(e) => setFormData({ ...formData, constructor_id: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="">Select Constructor</option>
                    {constructors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Position (0 for DNF)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Points</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.5"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Grid Position</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.grid}
                    onChange={(e) => setFormData({ ...formData, grid: parseInt(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="fastest_lap"
                    checked={formData.fastest_lap}
                    onChange={(e) => setFormData({ ...formData, fastest_lap: e.target.checked })}
                    className="w-5 h-5 accent-red-600"
                  />
                  <label htmlFor="fastest_lap" className="text-sm font-medium text-gray-400 cursor-pointer">Fastest Lap</label>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
