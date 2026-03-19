import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Constructor } from '../../types';
import { Plus, Edit2, Trash2, X, FileDown } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import BulkImport from '../../components/admin/BulkImport';
import { motion } from 'framer-motion';

export default function AdminConstructors() {
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConstructor, setEditingConstructor] = useState<Constructor | null>(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '', history: '' });
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    fetchConstructors();
  }, []);

  async function fetchConstructors() {
    const { data } = await supabase.from('constructors').select('*').order('name');
    if (data) setConstructors(data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingConstructor) {
        await supabase.from('constructors').update(formData).eq('id', editingConstructor.id);
      } else {
        await supabase.from('constructors').insert([formData]);
      }
      setIsModalOpen(false);
      setEditingConstructor(null);
      setFormData({ name: '', logo_url: '', history: '' });
      fetchConstructors();
    } catch (error) {
      console.error('Error saving constructor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this constructor?')) return;
    await supabase.from('constructors').delete().eq('id', id);
    fetchConstructors();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Constructors Management</h1>
          <p className="text-gray-400">Manage F1 teams and their history.</p>
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
              setEditingConstructor(null);
              setFormData({ name: '', logo_url: '', history: '' });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Constructor
          </button>
        </div>
      </div>

      {showBulkImport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <BulkImport table="constructors" onSuccess={fetchConstructors} />
        </motion.div>
      )}

      <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Team</th>
              <th className="px-6 py-4 font-bold">History Snippet</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {constructors.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={c.logo_url} className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1 border border-white/10" referrerPolicy="no-referrer" />
                    <span className="font-bold">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm line-clamp-1 max-w-xs">{c.history || 'No history added.'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingConstructor(c);
                        setFormData({
                          name: c.name,
                          logo_url: c.logo_url,
                          history: c.history || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingConstructor ? 'Edit Constructor' : 'Add New Constructor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Team Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Logo</label>
                  <FileUpload 
                    bucket="f1-archive"
                    folder="constructors"
                    currentUrl={formData.logo_url}
                    onUpload={(url) => setFormData({ ...formData, logo_url: url })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">History / Description</label>
                <textarea
                  rows={4}
                  value={formData.history}
                  onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none resize-none"
                />
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
                  {loading ? 'Saving...' : 'Save Constructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
