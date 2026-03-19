import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Season, Driver, Constructor } from '../../types';
import { Plus, Edit2, Trash2, X, FileDown, Copy } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import BulkImport from '../../components/admin/BulkImport';
import { motion } from 'framer-motion';

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({ 
    year: new Date().getFullYear(), 
    image_url: '',
    champion_driver_id: '', 
    champion_constructor_id: '',
    published: false
  });
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [seasonsRes, driversRes, constructorsRes] = await Promise.all([
      supabase.from('seasons').select('*, champion_driver:drivers(*), champion_constructor:constructors(*)').order('year', { ascending: false }),
      supabase.from('drivers').select('*').order('name'),
      supabase.from('constructors').select('*').order('name')
    ]);

    if (seasonsRes.data) setSeasons(seasonsRes.data);
    if (driversRes.data) setDrivers(driversRes.data);
    if (constructorsRes.data) setConstructors(constructorsRes.data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      year: formData.year,
      image_url: formData.image_url || null,
      champion_driver_id: formData.champion_driver_id || null,
      champion_constructor_id: formData.champion_constructor_id || null,
      published: formData.published
    };

    try {
      if (editingSeason) {
        await supabase.from('seasons').update(payload).eq('id', editingSeason.id);
      } else {
        await supabase.from('seasons').insert([payload]);
      }
      setIsModalOpen(false);
      setEditingSeason(null);
      fetchData();
    } catch (error) {
      console.error('Error saving season:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (season: Season) => {
    const newYear = season.year + 1;
    if (!confirm(`Duplicate the ${season.year} season to ${newYear}?`)) return;

    setLoading(true);
    try {
      const { data: newSeason, error: seasonError } = await supabase
        .from('seasons')
        .insert([{
          year: newYear,
          image_url: season.image_url,
          champion_driver_id: null,
          champion_constructor_id: null
        }])
        .select()
        .single();

      if (seasonError) throw seasonError;

      // Copy races
      const { data: originalRaces } = await supabase
        .from('races')
        .select('*')
        .eq('season_id', season.id);

      if (originalRaces && originalRaces.length > 0) {
        const newRaces = originalRaces.map(r => ({
          season_id: newSeason.id,
          name: r.name,
          circuit: r.circuit,
          date: new Date(new Date(r.date).setFullYear(newYear)).toISOString(),
          round: r.round,
          image_url: r.image_url,
          youtube_url: null
        }));

        const { error: racesError } = await supabase.from('races').insert(newRaces);
        if (racesError) throw racesError;
      }

      alert(`Successfully duplicated ${season.year} to ${newYear} with ${originalRaces?.length || 0} races.`);
      fetchData();
    } catch (error: any) {
      console.error('Error duplicating season:', error);
      alert('Failed to duplicate season: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all races and results for this season.')) return;
    await supabase.from('seasons').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Seasons Management</h1>
          <p className="text-gray-400">Manage F1 championship years.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="bg-zinc-900 text-gray-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/10 hover:bg-zinc-800 transition-all"
          >
            <FileDown className="w-5 h-5" />
            {showBulkImport ? 'Hide Import' : 'Bulk Import'}
          </button>
          <button
            onClick={() => {
              setEditingSeason(null);
              setFormData({ year: new Date().getFullYear(), image_url: '', champion_driver_id: '', champion_constructor_id: '', published: false });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Season
          </button>
        </div>
      </div>

      {showBulkImport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <BulkImport table="seasons" onSuccess={fetchData} />
        </motion.div>
      )}

      <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Year</th>
              <th className="px-6 py-4 font-bold">Driver Champion</th>
              <th className="px-6 py-4 font-bold">Constructor Champion</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {seasons.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xl">{s.year}</span>
                    {s.published ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Published</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-gray-500 text-[10px] font-bold uppercase tracking-widest border border-white/5">Draft</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{s.champion_driver?.name || '---'}</td>
                <td className="px-6 py-4 text-gray-400">{s.champion_constructor?.name || '---'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleDuplicate(s)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Duplicate Season"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSeason(s);
                        setFormData({
                          year: s.year,
                          image_url: s.image_url || '',
                          champion_driver_id: s.champion_driver_id || '',
                          champion_constructor_id: s.champion_constructor_id || '',
                          published: s.published
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingSeason ? 'Edit Season' : 'Add New Season'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Season Poster</label>
                  <FileUpload 
                    bucket="f1-archive"
                    folder="seasons"
                    currentUrl={formData.image_url}
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Driver Champion</label>
                  <select
                    value={formData.champion_driver_id}
                    onChange={(e) => setFormData({ ...formData, champion_driver_id: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="">Select Champion</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Constructor Champion</label>
                  <select
                    value={formData.champion_constructor_id}
                    onChange={(e) => setFormData({ ...formData, champion_constructor_id: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="">Select Champion</option>
                    {constructors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-black text-red-600 focus:ring-red-600"
                  />
                  <label htmlFor="published" className="text-sm font-bold text-white cursor-pointer">
                    Publish this season (make it visible to the public)
                  </label>
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
                  {loading ? 'Saving...' : 'Save Season'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
