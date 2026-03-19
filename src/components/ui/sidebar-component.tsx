import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar, 
  Flag, 
  BarChart3, 
  Image as ImageIcon, 
  Settings as SettingsIcon,
  Download,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  onSignOut: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard, end: true },
  { id: "drivers", label: "Drivers", href: "/admin/drivers", icon: Users },
  { id: "constructors", label: "Constructors", href: "/admin/constructors", icon: Trophy },
  { id: "seasons", label: "Seasons", href: "/admin/seasons", icon: Calendar },
  { id: "races", label: "Races", href: "/admin/races", icon: Flag },
  { id: "results", label: "Results", href: "/admin/results", icon: BarChart3 },
  { id: "media", label: "Media", href: "/admin/media", icon: ImageIcon },
  { id: "import", label: "Import Data", href: "/admin/import", icon: Download },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: SettingsIcon },
];

export function Sidebar({ onSignOut }: SidebarProps) {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col fixed h-full z-20">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tighter text-red-600 italic">F1</span>
          <span className="text-xl font-semibold tracking-tight text-white uppercase">Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )
            }
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform duration-200",
              "group-hover:translate-x-1 opacity-0 group-hover:opacity-100"
            )} />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={onSignOut}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-red-600/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
