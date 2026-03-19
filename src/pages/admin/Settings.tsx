import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { Shield, User as UserIcon, Mail, Calendar, Trash2, Edit2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminSettings() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProfiles(data);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateRole = async (profile: UserProfile) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) throw error;
      setEditingProfile(null);
      fetchProfiles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert('Failed to update role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400">Manage user roles and global archive settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-red-500 w-5 h-5" />
                User Management
              </h3>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 font-bold uppercase tracking-wider">
                {profiles.length} Total Users
              </span>
            </div>
            
            {error && (
              <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">Joined</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white truncate max-w-[200px]">{profile.id}</p>
                            <p className="text-xs text-gray-500">UID</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingProfile?.id === profile.id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="bg-black border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:ring-1 focus:ring-red-600 outline-none"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            profile.role === 'admin' ? "bg-red-600/20 text-red-500" : "bg-white/5 text-gray-400"
                          )}>
                            {profile.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {editingProfile?.id === profile.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateRole(profile)}
                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingProfile(null)}
                                className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingProfile(profile);
                                setNewRole(profile.role);
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6">Archive Info</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Version</p>
                <p className="text-white font-bold">1.0.0-stable</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Last Backup</p>
                <p className="text-white font-bold">Never</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Storage Usage</p>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2">
                  <div className="bg-red-600 h-full rounded-full w-[15%]" />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">15% of 1GB Free Tier</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 text-red-500">Danger Zone</h3>
            <button className="w-full py-3 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl font-bold hover:bg-red-600/20 transition-all">
              Clear Cache
            </button>
            <p className="text-[10px] text-gray-500 mt-4 text-center uppercase font-bold tracking-widest">
              Proceed with caution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
