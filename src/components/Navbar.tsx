import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, Shield, Search, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Seasons', href: '/seasons', icon: Calendar },
    { name: 'Drivers', href: '/drivers', icon: Users },
    { name: 'Constructors', href: '/constructors', icon: Trophy },
    { name: 'Records', href: '/records', icon: Shield },
    { name: 'Search', href: '/search', icon: Search },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tighter text-red-600 italic">F1</span>
              <span className="text-xl font-semibold tracking-tight text-white uppercase">Archive</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive ? "text-white bg-white/10" : "text-gray-300 hover:text-white hover:bg-white/5"
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
              {role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:text-red-400 transition-colors",
                      isActive ? "bg-red-500/10" : ""
                    )
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <UserIcon size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-300 font-medium">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    navigate('/login');
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all"
              >
                Admin Login
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-black/95 border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {item.name}
              </Link>
            ))}
            {role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-400"
              >
                Admin
              </Link>
            )}
            <div className="pt-4 pb-1 border-t border-white/10 mt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Logged in as: <span className="text-white">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      navigate('/login');
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-500"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
