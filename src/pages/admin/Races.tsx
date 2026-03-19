import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Race, Season } from '../../types';
import { Plus, Edit2, Trash2, X, Calendar, MapPin, Link as LinkIcon, FileDown } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import BulkImport from '../../components/admin/BulkImport';
import { motion } from 'framer-motion';

export default function AdminRaces() {
  const [races, setRaces] = useState<Race[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    circuit: '', 
    date: '', 
    season_id: '', 
    image_url: '', 
    youtube_url: '' 
  });
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [racesRes, seasonsRes] = await Promise.all([
      supabase.from('races').select('*, season:seasons(*)').order('date', { ascending: false }),
      supabase.from('seasons').select('*').order('year', { ascending: false })
    ]);

    if (racesRes.data) setRaces(racesRes.data);
    if (seasonsRes.data) setSeasons(seasonsRes.data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRace) {
        await supabase.from('races').update(formData).eq('id', editingRace.id);
      } else {
        await supabase.from('races').insert([formData]);
      }
      setIsModalOpen(false);
      setEditingRace(null);
      fetchData();
    } catch (error) {
      console.error('Error saving race:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all results for this race.')) return;
    await supabase.from('races').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Races Management</h1>
          <p className="text-gray-400">Manage individual Grand Prix events.</p>
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
              setEditingRace(null);
              setFormData({ name: '', circuit: '', date: '', season_id: '', image_url: '', youtube_url: '' });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Race
          </button>
        </div>
      </div>

      {showBulkImport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <BulkImport table="races" onSuccess={fetchData} />
        </motion.div>
      )}

      <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Race</th>
              <th className="px-6 py-4 font-bold">Season</th>
              <th className="px-6 py-4 font-bold">Circuit</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {races.map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={r.image_url} className="w-10 h-6 rounded object-cover border border-white/10" referrerPolicy="no-referrer" />
                    <span className="font-bold">{r.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{r.season?.year}</td>
                <td className="px-6 py-4 text-gray-400">{r.circuit}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingRace(r);
                        setFormData({
                          name: r.name,
                          circuit: r.circuit,
                          date: r.date,
                          season_id: r.season_id,
                          image_url: r.image_url || '',
                          youtube_url: r.youtube_url || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
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
              <h2 className="text-xl font-bold">{editingRace ? 'Edit Race' : 'Add New Race'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Race Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                    placeholder="e.g. Monaco Grand Prix"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Season</label>
                  <select
                    required
                    value={formData.season_id}
                    onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    <option value="">Select Season</option>
                    {seasons.map(s => <option key={s.id} value={s.id}>{s.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Circuit</label>
                  <input
                    type="text"
                    required
                    value={formData.circuit}
                    onChange={(e) => setFormData({ ...formData, circuit: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Race Image</label>
                  <FileUpload 
                    bucket="f1-archive"
                    folder="races"
                    currentUrl={formData.image_url}
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">YouTube Highlight URL</label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
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
                  {loading ? 'Saving...' : 'Save Race'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
