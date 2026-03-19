import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Driver } from '../../types';
import { Plus, Search, Edit2, Trash2, X, Upload, FileDown } from 'lucide-react';
import FileUpload from '../../components/FileUpload';
import BulkImport from '../../components/admin/BulkImport';
import { motion } from 'framer-motion';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({ name: '', nationality: '', dob: '', image_url: '', bio: '' });
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    const { data } = await supabase.from('drivers').select('*').order('name');
    if (data) setDrivers(data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDriver) {
        await supabase.from('drivers').update(formData).eq('id', editingDriver.id);
      } else {
        await supabase.from('drivers').insert([formData]);
      }
      setIsModalOpen(false);
      setEditingDriver(null);
      setFormData({ name: '', nationality: '', dob: '', image_url: '', bio: '' });
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    await supabase.from('drivers').delete().eq('id', id);
    fetchDrivers();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Drivers Management</h1>
          <p className="text-gray-400">Add, edit, or remove drivers from the archive.</p>
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
              setEditingDriver(null);
              setFormData({ name: '', nationality: '', dob: '', image_url: '', bio: '' });
              setIsModalOpen(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Driver
          </button>
        </div>
      </div>

      {showBulkImport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <BulkImport table="drivers" onSuccess={fetchDrivers} />
        </motion.div>
      )}

      <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Driver</th>
              <th className="px-6 py-4 font-bold">Nationality</th>
              <th className="px-6 py-4 font-bold">DOB</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={driver.image_url} className="w-10 h-10 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                    <span className="font-bold">{driver.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{driver.nationality}</td>
                <td className="px-6 py-4 text-gray-400">{driver.dob}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingDriver(driver);
                        setFormData({
                          name: driver.name,
                          nationality: driver.nationality,
                          dob: driver.dob,
                          image_url: driver.image_url,
                          bio: driver.bio || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
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
              <h2 className="text-xl font-bold">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nationality</label>
                  <input
                    type="text"
                    required
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Driver Image</label>
                  <FileUpload 
                    bucket="f1-archive"
                    folder="drivers"
                    currentUrl={formData.image_url}
                    onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Biography</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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
                  {loading ? 'Saving...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
