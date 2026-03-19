import React from 'react';
import { Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, role, loading, refreshRole } = useAuth();
  const projectRef =
    ((supabase as any)?.supabaseUrl as string | undefined)?.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] ??
    'unknown';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 max-w-md mb-8">
          You do not have administrative privileges to access this section. 
          Please contact the system administrator if you believe this is an error.
        </p>
        <div className="text-xs text-gray-500 mb-6">
          Current role: <span className="text-gray-300 font-mono">{role ?? 'unknown'}</span>
          <div className="mt-2">
            User id: <span className="text-gray-300 font-mono">{user?.id ?? 'none'}</span>
          </div>
          <div className="mt-1">
            Project ref: <span className="text-gray-300 font-mono">{projectRef}</span>
          </div>
        </div>
        <button
          onClick={() => refreshRole()}
          className="mb-3 bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-all"
        >
          Retry Role Check
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
