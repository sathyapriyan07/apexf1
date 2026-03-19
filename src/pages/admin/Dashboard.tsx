import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Trophy, 
  Calendar, 
  Flag, 
  Plus,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Components
import { Sidebar } from '../../components/ui/sidebar-component';

// Sub-components for Admin
import AdminDrivers from './Drivers';
import AdminConstructors from './Constructors';
import AdminSeasons from './Seasons';
import AdminRaces from './Races';
import AdminResults from './Results';
import AdminMedia from './Media';
import AdminSettings from './Settings';
import AdminImport from './Import';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/drivers" element={<AdminDrivers />} />
          <Route path="/constructors" element={<AdminConstructors />} />
          <Route path="/seasons" element={<AdminSeasons />} />
          <Route path="/races" element={<AdminRaces />} />
          <Route path="/results" element={<AdminResults />} />
          <Route path="/media" element={<AdminMedia />} />
          <Route path="/import" element={<AdminImport />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState({ drivers: 0, constructors: 0, seasons: 0, races: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [drivers, constructors, seasons, races] = await Promise.all([
        supabase.from('drivers').select('id', { count: 'exact' }),
        supabase.from('constructors').select('id', { count: 'exact' }),
        supabase.from('seasons').select('id', { count: 'exact' }),
        supabase.from('races').select('id', { count: 'exact' }),
      ]);

      setStats({
        drivers: drivers.count || 0,
        constructors: constructors.count || 0,
        seasons: seasons.count || 0,
        races: races.count || 0,
      });
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Manage your Formula One archive data from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Total Drivers', value: stats.drivers, icon: Users, color: 'text-blue-500' },
          { name: 'Constructors', value: stats.constructors, icon: Trophy, color: 'text-yellow-500' },
          { name: 'Seasons', value: stats.seasons, icon: Calendar, color: 'text-red-500' },
          { name: 'Total Races', value: stats.races, icon: Flag, color: 'text-green-500' },
        ].map((stat) => (
          <div key={stat.name} className="bg-zinc-900 border border-white/10 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 bg-white/5 rounded-2xl", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-gray-400 font-medium">{stat.name}</p>
            <p className="text-4xl font-black text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/drivers" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
              <span className="font-bold">Add Driver</span>
              <Plus className="w-5 h-5 text-red-500 group-hover:scale-125 transition-transform" />
            </Link>
            <Link to="/admin/races" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
              <span className="font-bold">New Race</span>
              <Plus className="w-5 h-5 text-red-500 group-hover:scale-125 transition-transform" />
            </Link>
            <Link to="/admin/results" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
              <span className="font-bold">Add Results</span>
              <Plus className="w-5 h-5 text-red-500 group-hover:scale-125 transition-transform" />
            </Link>
            <Link to="/admin/seasons" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
              <span className="font-bold">New Season</span>
              <Plus className="w-5 h-5 text-red-500 group-hover:scale-125 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 font-bold">Supabase Connected</span>
              </div>
              <span className="text-xs text-green-500/60 uppercase font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-blue-500 font-bold">Storage Buckets</span>
              </div>
              <span className="text-xs text-blue-500/60 uppercase font-bold">Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
