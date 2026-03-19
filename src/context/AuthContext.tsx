import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchRole(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Session error:', err);
        setLoading(false);
      });

    // Safety timeout: ensure loading ends even if network hangs.
    // If we timed out, default to 'user' (never auto-admin).
    const timeout = setTimeout(() => {
      setRole(prev => prev ?? 'user');
      setLoading(false);
    }, 5000);

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const fetchRole = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        // If profile row doesn't exist yet (common for existing users before trigger/policies),
        // create a safe default profile and retry.
        const missingRow =
          typeof (error as any)?.message === 'string' &&
          ((error as any).message.includes('0 rows') || (error as any).message.includes('No rows'));

        if (missingRow) {
          const { error: insertError } = await supabase.from('profiles').insert({ id: userId, role: 'user' });
          if (!insertError) {
            setRole('user');
            return;
          }
        }

        throw error;
      }

      setRole(data?.role || 'user');
    } catch (err) {
      console.error('Error fetching role:', err);
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  const refreshRole = async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data?.session?.user?.id;
    if (uid) await fetchRole(uid);
  };

  const signOut = async () => {
    try {
      // Try global signout first; fall back to local so UI/session still clears offline.
      try {
        await supabase.auth.signOut({ scope: 'global' } as any);
      } catch {
        await supabase.auth.signOut({ scope: 'local' } as any);
      }
    } finally {
      try {
        (supabase.auth as any)?.stopAutoRefresh?.();
      } catch {}

      // Best-effort: clear any persisted Supabase auth tokens for this project.
      try {
        const url = (supabase as any)?.supabaseUrl as string | undefined;
        const ref = url?.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1];
        if (ref && typeof localStorage !== 'undefined') {
          const prefix = `sb-${ref}-`;
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith(prefix)) localStorage.removeItem(key);
          }
        }
      } catch {}

      // Ensure local state clears even if onAuthStateChange is delayed.
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
